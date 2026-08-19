import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { UpliftEscrow } from '../target/types/uplift_escrow';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from '@solana/spl-token';
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { assert } from 'chai';

/**
 * Core money-flow tests that run on a real-time localnet (`anchor test`):
 * config setup, yield-reserve funding, enrollment, finishing a 1-day cohort
 * (stake + interest returned), and a free-cancel refund.
 *
 * The settlement / redistribution path (`lapse_enrollment` -> `settle_challenge`
 * -> `claim_bonus`) needs the cohort window to have elapsed, which real time
 * can't provide in one run. Test that path with anchor-bankrun clock control
 * (`context.setClock`) or against a naturally-ended devnet cohort — see README.
 */
describe('uplift-escrow', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.UpliftEscrow as Program<UpliftEscrow>;
  const admin = (provider.wallet as anchor.Wallet).payer;

  const USDC_DECIMALS = 6;
  const ONE_USDC = 10 ** USDC_DECIMALS;
  const FEE_BPS = 100; // 1%
  const APY_BPS = 450; // 4.5%

  let mint: PublicKey;
  let treasury: PublicKey;
  let adminAta: PublicKey;
  let configPda: PublicKey;
  let vaultAuthority: PublicKey;
  let yieldReserve: PublicKey;

  const settlementAuthority = Keypair.generate();

  const enc = (n: number) => new anchor.BN(n).toArrayLike(Buffer, 'le', 8);

  before(async () => {
    mint = await createMint(provider.connection, admin, admin.publicKey, null, USDC_DECIMALS);
    adminAta = (await getOrCreateAssociatedTokenAccount(provider.connection, admin, mint, admin.publicKey)).address;
    treasury = (await getOrCreateAssociatedTokenAccount(provider.connection, admin, mint, admin.publicKey, false, undefined, undefined, undefined)).address;
    // Give the admin a big balance to fund the reserve + play both users.
    await mintTo(provider.connection, admin, mint, adminAta, admin, 1_000_000 * ONE_USDC);

    [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId);
    [vaultAuthority] = PublicKey.findProgramAddressSync([Buffer.from('vault_auth')], program.programId);
    [yieldReserve] = PublicKey.findProgramAddressSync([Buffer.from('yield_reserve')], program.programId);
  });

  it('initializes config + yield reserve', async () => {
    await program.methods
      .initializeConfig(settlementAuthority.publicKey, FEE_BPS, APY_BPS)
      .accounts({
        admin: admin.publicKey,
        config: configPda,
        vaultAuthority,
        stakeMint: mint,
        treasury,
        yieldReserve,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const cfg = await program.account.config.fetch(configPda);
    assert.equal(cfg.protocolFeeBps, FEE_BPS);
    assert.equal(cfg.yieldApyBps, APY_BPS);
    assert.ok(cfg.settlementAuthority.equals(settlementAuthority.publicKey));
  });

  it('funds the yield reserve', async () => {
    await program.methods
      .fundYieldReserve(new anchor.BN(1_000 * ONE_USDC))
      .accounts({
        funder: admin.publicKey,
        config: configPda,
        yieldReserve,
        funderTokenAccount: adminAta,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .rpc();
    const bal = await getAccount(provider.connection, yieldReserve);
    assert.equal(Number(bal.amount), 1_000 * ONE_USDC);
  });

  it('enrolls, proves the final day, and returns stake + interest', async () => {
    const challengeId = 1;
    const days = 1;
    const perDay = 5 * ONE_USDC;
    const now = Math.floor(Date.now() / 1000);
    const startTs = now - 60; // started a minute ago; window ends ~1 day out

    const [challenge] = PublicKey.findProgramAddressSync([Buffer.from('challenge'), enc(challengeId)], program.programId);
    const [vault] = PublicKey.findProgramAddressSync([Buffer.from('vault'), enc(challengeId)], program.programId);

    await program.methods
      .createChallenge(new anchor.BN(challengeId), days, new anchor.BN(perDay), false, new anchor.BN(startTs))
      .accounts({
        admin: admin.publicKey,
        config: configPda,
        vaultAuthority,
        challenge,
        stakeMint: mint,
        vault,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    // Fund a fresh user.
    const user = Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
    );
    const userAta = (await getOrCreateAssociatedTokenAccount(provider.connection, admin, mint, user.publicKey)).address;
    await mintTo(provider.connection, admin, mint, userAta, admin, 100 * ONE_USDC);

    const [enrollment] = PublicKey.findProgramAddressSync(
      [Buffer.from('enrollment'), enc(challengeId), user.publicKey.toBuffer()],
      program.programId,
    );

    await program.methods
      .enroll(new anchor.BN(challengeId))
      .accounts({
        user: user.publicKey,
        config: configPda,
        challenge,
        enrollment,
        vault,
        treasury,
        userTokenAccount: userAta,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const stake = days * perDay;
    const afterEnroll = await getAccount(provider.connection, userAta);
    assert.equal(Number(afterEnroll.amount), 100 * ONE_USDC - stake - stake * 0.01);

    // Settlement authority attests the single required day -> finish.
    await program.methods
      .submitProof(new anchor.BN(challengeId))
      .accounts({
        settlementAuthority: settlementAuthority.publicKey,
        config: configPda,
        vaultAuthority,
        challenge,
        enrollment,
        vault,
        yieldReserve,
        userTokenAccount: userAta,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .signers([settlementAuthority])
      .rpc();

    const e = await program.account.enrollment.fetch(enrollment);
    assert.equal(e.status, 1); // Won
    const interest = Math.floor((stake * APY_BPS * days) / (10_000 * 365));
    const afterFinish = await getAccount(provider.connection, userAta);
    // Started with 100 USDC, paid stake + 1% fee, got stake + interest back.
    assert.equal(Number(afterFinish.amount), 100 * ONE_USDC - stake * 0.01 + interest);
  });

  it('refunds a free-cancel forfeit in full', async () => {
    const challengeId = 2;
    const perDay = 3 * ONE_USDC;
    const now = Math.floor(Date.now() / 1000);
    const [challenge] = PublicKey.findProgramAddressSync([Buffer.from('challenge'), enc(challengeId)], program.programId);
    const [vault] = PublicKey.findProgramAddressSync([Buffer.from('vault'), enc(challengeId)], program.programId);

    await program.methods
      .createChallenge(new anchor.BN(challengeId), 2, new anchor.BN(perDay), true, new anchor.BN(now - 30))
      .accounts({
        admin: admin.publicKey, config: configPda, vaultAuthority, challenge,
        stakeMint: mint, vault, tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId, rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const user = Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
    );
    const userAta = (await getOrCreateAssociatedTokenAccount(provider.connection, admin, mint, user.publicKey)).address;
    await mintTo(provider.connection, admin, mint, userAta, admin, 50 * ONE_USDC);
    const [enrollment] = PublicKey.findProgramAddressSync(
      [Buffer.from('enrollment'), enc(challengeId), user.publicKey.toBuffer()], program.programId,
    );

    await program.methods.enroll(new anchor.BN(challengeId)).accounts({
      user: user.publicKey, config: configPda, challenge, enrollment, vault, treasury,
      userTokenAccount: userAta, tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId,
    }).signers([user]).rpc();

    await program.methods.forfeit(new anchor.BN(challengeId)).accounts({
      user: user.publicKey, config: configPda, vaultAuthority, challenge, enrollment, vault,
      userTokenAccount: userAta, tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    }).signers([user]).rpc();

    // Fee-free cohort + within grace window => full balance restored.
    const bal = await getAccount(provider.connection, userAta);
    assert.equal(Number(bal.amount), 50 * ONE_USDC);
  });
});
