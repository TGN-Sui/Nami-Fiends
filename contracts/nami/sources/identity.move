module nami::identity {

    use std::option;
    use std::vector;

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::errors;

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
        passport_id: option::Option<address>,

        /// Immutable Nami nodename chosen at enter_nami.
        /// Display names stay off-chain and may change without passport updates.
        nodename: vector<u8>,

        created_at_ms: u64,

        version: u8,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct IdentityCreated has copy, drop {
        identity_id: address,
        owner: address,
        nodename: vector<u8>,
    }

    // =========================================================
    // INTERNAL CREATE
    // =========================================================
    fun create_identity(nodename: vector<u8>, ctx: &mut TxContext): Identity {
        let sender = tx_context::sender(ctx);

        Identity {
            id: object::new(ctx),
            owner: sender,
            trust_tier: 0,
            verification_level: 0,
            passport_id: option::none(),
            nodename,
            created_at_ms: tx_context::epoch_timestamp_ms(ctx),
            version: 1,
        }
    }

    // =========================================================
    // PUBLIC INITIALIZER
    // =========================================================
    public fun init_identity(ctx: &mut TxContext) {
        let identity = mint_identity(ctx);
        let owner = identity.owner;
        transfer::transfer(identity, owner);
    }

    public(package) fun mint_identity(ctx: &mut TxContext): Identity {
        mint_identity_with_nodename(vector[], ctx)
    }

    public(package) fun mint_identity_with_nodename(
        nodename: vector<u8>,
        ctx: &mut TxContext
    ): Identity {
        let identity = create_identity(nodename, ctx);

        sui::event::emit(IdentityCreated {
            identity_id: object::uid_to_address(&identity.id),
            owner: identity.owner,
            nodename: identity.nodename,
        });

        identity
    }

    public(package) fun link_passport(
        identity: &mut Identity,
        passport_id: address,
    ) {
        assert!(
            option::is_none(&identity.passport_id),
            errors::passport_already_linked()
        );

        identity.passport_id = option::some(passport_id);
    }

    public fun get_passport_id(identity: &Identity): option::Option<address> {
        identity.passport_id
    }

    public(package) fun transfer_to_owner(identity: Identity, owner: address) {
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

    public fun get_nodename(identity: &Identity): vector<u8> {
        identity.nodename
    }

    public fun has_nodename(identity: &Identity): bool {
        !identity.nodename.is_empty()
    }
}