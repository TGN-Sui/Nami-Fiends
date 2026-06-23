module nami::onboarding {

    use sui::object::{Self, UID};
    use sui::table::{Self, Table};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::badge;
    use nami::errors;
    use nami::identity;
    use nami::passport;
    use nami::profile;

    // =========================================================
    // CONSTANTS
    // =========================================================
    const FIEND_PREFIX: vector<u8> = b"fiend";
    const MIN_NODENAME_LEN: u64 = 8;
    const MAX_NODENAME_LEN: u64 = 24;
    const MAX_AVATAR_REF_LEN: u64 = 512;

    // =========================================================
    // NODENAME REGISTRY
    // =========================================================
    public struct NodenameRegistry has key {
        id: UID,
        nodenames: Table<vector<u8>, address>,
        owners: Table<address, address>,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct EnterNamiCompleted has copy, drop {
        owner: address,
        identity_id: address,
        passport_id: address,
        profile_id: address,
        nodename: vector<u8>,
        archetype: u8,
    }

    public struct NodenameRegistered has copy, drop {
        nodename: vector<u8>,
        identity_id: address,
        owner: address,
    }

    // =========================================================
    // PACKAGE INIT
    // =========================================================
    fun init(ctx: &mut TxContext) {
        let registry = new_registry(ctx);
        transfer::share_object(registry);
    }

    fun new_registry(ctx: &mut TxContext): NodenameRegistry {
        NodenameRegistry {
            id: object::new(ctx),
            nodenames: table::new(ctx),
            owners: table::new(ctx),
        }
    }

    #[test_only]
    public fun create_registry_for_testing(ctx: &mut TxContext): NodenameRegistry {
        new_registry(ctx)
    }

    #[test_only]
    public fun share_registry_for_testing(ctx: &mut TxContext) {
        transfer::share_object(new_registry(ctx));
    }

    // =========================================================
    // VALIDATION
    // =========================================================
    fun is_valid_nodename_char(byte: u8): bool {
        (byte >= 97 && byte <= 122) || // a-z
        (byte >= 48 && byte <= 57) || // 0-9
        byte == 95 // _
    }

    fun starts_with(haystack: &vector<u8>, prefix: &vector<u8>): bool {
        let haystack_len = haystack.length();
        let prefix_len = prefix.length();

        if (haystack_len < prefix_len) {
            return false
        };

        let mut index = 0;

        while (index < prefix_len) {
            if (haystack[index] != prefix[index]) {
                return false
            };

            index = index + 1;
        };

        true
    }

    fun assert_valid_nodename(nodename: &vector<u8>) {
        let len = nodename.length();

        assert!(len >= MIN_NODENAME_LEN, errors::invalid_nodename());
        assert!(len <= MAX_NODENAME_LEN, errors::invalid_nodename());
        let prefix = FIEND_PREFIX;
        assert!(starts_with(nodename, &prefix), errors::invalid_nodename());

        let mut index = 0;

        while (index < len) {
            assert!(is_valid_nodename_char(nodename[index]), errors::invalid_nodename());
            index = index + 1;
        };
    }

    fun assert_valid_avatar_ref(avatar_ref: &vector<u8>) {
        assert!(
            avatar_ref.length() <= MAX_AVATAR_REF_LEN,
            errors::invalid_avatar_ref()
        );
    }

    fun assert_owner_not_registered(
        registry: &NodenameRegistry,
        owner: address,
    ) {
        assert!(
            !table::contains(&registry.owners, owner),
            errors::already_entered_nami()
        );
    }

    fun assert_nodename_available(
        registry: &NodenameRegistry,
        nodename: &vector<u8>,
    ) {
        assert!(
            !table::contains(&registry.nodenames, *nodename),
            errors::nodename_taken()
        );
    }

    fun register_nodename(
        registry: &mut NodenameRegistry,
        nodename: &vector<u8>,
        identity_id: address,
        owner: address,
    ) {
        table::add(&mut registry.nodenames, *nodename, identity_id);
        table::add(&mut registry.owners, owner, identity_id);

        sui::event::emit(NodenameRegistered {
            nodename: *nodename,
            identity_id,
            owner,
        });
    }

    // =========================================================
    // ENTER NAMI
    // One-time wallet signature that anchors immutable identity.
    // XP, tier, conduct, and display copy stay off-chain.
    // =========================================================
    public fun enter_nami(
        registry: &mut NodenameRegistry,
        nodename: vector<u8>,
        archetype: u8,
        avatar_ref: vector<u8>,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);

        assert_valid_nodename(&nodename);
        assert_valid_avatar_ref(&avatar_ref);
        assert_owner_not_registered(registry, owner);
        assert_nodename_available(registry, &nodename);

        let mut identity_obj = identity::mint_identity_with_nodename(nodename, ctx);
        let identity_id = identity::get_id(&identity_obj);

        let passport_obj = passport::create_onboarding_anchor(identity_id, archetype, ctx);
        let passport_id = passport::get_id(&passport_obj);

        identity::link_passport(&mut identity_obj, passport_id);

        passport::emit_passport_created(passport_id, identity_id);

        let profile_obj = profile::mint_onboarding_profile(
            &passport_obj,
            avatar_ref,
            ctx
        );
        let profile_id = profile::get_id(&profile_obj);

        badge::mint_onboarding_badge(
            owner,
            b"onboarding",
            ctx
        );

        let bound_nodename = identity::get_nodename(&identity_obj);

        sui::event::emit(EnterNamiCompleted {
            owner,
            identity_id,
            passport_id,
            profile_id,
            nodename: bound_nodename,
            archetype,
        });

        register_nodename(registry, &bound_nodename, identity_id, owner);

        identity::transfer_to_owner(identity_obj, owner);
        passport::transfer_to_owner(passport_obj, owner);
        profile::transfer_to_owner(profile_obj, owner);
    }

    // =========================================================
    // GETTERS
    // =========================================================
    public fun resolve_identity_for_nodename(
        registry: &NodenameRegistry,
        nodename: vector<u8>
    ): address {
        *table::borrow(&registry.nodenames, nodename)
    }

    public fun resolve_identity_for_owner(
        registry: &NodenameRegistry,
        owner: address
    ): address {
        *table::borrow(&registry.owners, owner)
    }

    public fun has_nodename(
        registry: &NodenameRegistry,
        nodename: vector<u8>
    ): bool {
        table::contains(&registry.nodenames, nodename)
    }

    public fun has_owner(
        registry: &NodenameRegistry,
        owner: address
    ): bool {
        table::contains(&registry.owners, owner)
    }
}