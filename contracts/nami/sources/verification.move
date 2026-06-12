module nami::verification {

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::identity;
    use nami::passport;
    use nami::errors;

    // =========================================================
    // VERIFICATION SOURCES
    // =========================================================

    /// Manual / protocol-approved verification.
    const SOURCE_NAMI: u8 = 1;

    /// X.com verification carryover.
    const SOURCE_X: u8 = 2;

    /// zkLogin-backed verification.
    const SOURCE_ZKLOGIN: u8 = 3;

    /// Future Steam account linkage.
    const SOURCE_STEAM: u8 = 4;

    /// Future Epic Games account linkage.
    const SOURCE_EPIC: u8 = 5;

    /// Future SuiNS proof.
    const SOURCE_SUINS: u8 = 6;

    // =========================================================
    // VERIFICATION LEVELS
    // =========================================================

    const HUMAN_VERIFIED: u8 = 1;

    // =========================================================
    // VERIFICATION RECORD
    // =========================================================
    public struct VerificationRecord has key {
        id: UID,

        identity_id: address,
        passport_id: address,

        owner: address,

        source: u8,
        verification_level: u8,

        created_at_ms: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct IdentityVerified has copy, drop {
        identity_id: address,
        passport_id: address,
        owner: address,
        source: u8,
        verification_level: u8,
    }

    // =========================================================
    // HELPERS
    // =========================================================
    fun is_supported_source(source: u8): bool {
        source == SOURCE_NAMI ||
        source == SOURCE_X ||
        source == SOURCE_ZKLOGIN ||
        source == SOURCE_STEAM ||
        source == SOURCE_EPIC ||
        source == SOURCE_SUINS
    }

    fun create_record(
        identity_id: address,
        passport_id: address,
        owner: address,
        source: u8,
        ctx: &mut TxContext
    ): VerificationRecord {
        VerificationRecord {
            id: object::new(ctx),
            identity_id,
            passport_id,
            owner,
            source,
            verification_level: HUMAN_VERIFIED,
            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
        }
    }

    // =========================================================
    // VERIFY TO ADVENTURER
    // =========================================================
    public fun verify_to_adventurer(
        identity_obj: &identity::Identity,
        passport_obj: &mut passport::Passport,
        source: u8,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);

        let identity_id = identity::get_id(identity_obj);
        let passport_id = passport::get_id(passport_obj);

        assert!(
            identity::get_owner(identity_obj) == owner,
            errors::invalid_owner()
        );

        assert!(
            passport::get_identity_id(passport_obj) == identity_id,
            errors::invalid_owner()
        );

        assert!(
            is_supported_source(source),
            errors::insufficient_verification()
        );

        passport::verify_to_adventurer(passport_obj);

        let record = create_record(
            identity_id,
            passport_id,
            owner,
            source,
            ctx
        );

        sui::event::emit(IdentityVerified {
            identity_id,
            passport_id,
            owner,
            source,
            verification_level: HUMAN_VERIFIED,
        });

        transfer::transfer(record, owner);
    }

    // =========================================================
    // GETTERS
    // =========================================================
    public fun get_record_source(record: &VerificationRecord): u8 {
        record.source
    }

    public fun get_record_level(record: &VerificationRecord): u8 {
        record.verification_level
    }

    public fun get_record_owner(record: &VerificationRecord): address {
        record.owner
    }

    public fun get_record_identity_id(record: &VerificationRecord): address {
        record.identity_id
    }

    public fun get_record_passport_id(record: &VerificationRecord): address {
        record.passport_id
    }
}