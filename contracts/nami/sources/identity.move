module nami::identity {

    use std::option;

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    // =========================================================
    // IDENTITY OBJECT
    // =========================================================
    public struct Identity has key {
        id: UID,

        /// Wallet / zkLogin owner
        owner: address,

        /// Community trust tier.
        /// Membership/access tier lives in Passport.
        trust_tier: u8,

        /// Verification strength.
        /// 0 = unverified
        verification_level: u8,

        /// Linked Passport object address.
        /// This is reserved for future automatic passport linking.
        passport_id: option::Option<address>,

        created_at_ms: u64,

        version: u8,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct IdentityCreated has copy, drop {
        identity_id: address,
        owner: address,
    }

    // =========================================================
    // INTERNAL CREATE
    // =========================================================
    fun create_identity(ctx: &mut TxContext): Identity {
        let sender = tx_context::sender(ctx);

        Identity {
            id: object::new(ctx),
            owner: sender,
            trust_tier: 0,
            verification_level: 0,
            passport_id: option::none(),
            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
            version: 1,
        }
    }

    // =========================================================
    // PUBLIC INITIALIZER
    // =========================================================
    public fun init_identity(ctx: &mut TxContext) {
        let identity = create_identity(ctx);

        let owner = identity.owner;
        let identity_id = object::uid_to_address(&identity.id);

        sui::event::emit(IdentityCreated {
            identity_id,
            owner,
        });

        transfer::transfer(identity, owner);
    }

    public fun get_owner(identity: &Identity): address {
    identity.owner
    }

    public fun get_verification_level(identity: &Identity): u8 {
    identity.verification_level
    }
    
    public fun get_id(identity: &Identity): address {
    object::uid_to_address(&identity.id)
}
}