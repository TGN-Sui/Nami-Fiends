module nami::profile {

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::conduct;
    use nami::errors;
    use nami::passport;

    // =========================================================
    // PUBLIC PROFILE OBJECT
    // =========================================================
    public struct Profile has key {
        id: UID,

        owner: address,
        passport_id: address,

        /// Public display name.
        /// Keep short in frontend/backend validation.
        display_name: vector<u8>,

        /// Off-chain bio reference.
        /// Could be empty, URI, hash, Walrus ref, etc.
        bio_ref: vector<u8>,

        /// Off-chain avatar reference.
        avatar_ref: vector<u8>,

        /// General profile metadata reference.
        metadata_ref: vector<u8>,

        is_public: bool,

        created_at_ms: u64,
        updated_at_ms: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct ProfileCreated has copy, drop {
        profile_id: address,
        owner: address,
        passport_id: address,
        is_public: bool,
    }

    public struct ProfileUpdated has copy, drop {
        profile_id: address,
        owner: address,
        passport_id: address,
        is_public: bool,
    }

    // =========================================================
    // ACCESS CHECK
    // =========================================================
    fun assert_profile_access(
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        ctx: &TxContext
    ) {
        let sender = tx_context::sender(ctx);

        assert!(
            conduct::get_owner(conduct_status) == sender,
            errors::invalid_owner()
        );

        assert!(
            conduct::get_passport_id(conduct_status) == passport::get_id(passport_obj),
            errors::invalid_owner()
        );

        assert!(
            conduct::has_active_benefits(conduct_status, ctx),
            errors::conduct_restricted()
        );
    }

    // =========================================================
    // CREATE PROFILE
    // NPC users may create profiles.
    // Black Passport cannot create/update while restricted.
    // =========================================================
    public fun create_profile(
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        display_name: vector<u8>,
        bio_ref: vector<u8>,
        avatar_ref: vector<u8>,
        metadata_ref: vector<u8>,
        is_public: bool,
        ctx: &mut TxContext
    ) {
        let profile = mint_profile(
            passport_obj,
            conduct_status,
            display_name,
            bio_ref,
            avatar_ref,
            metadata_ref,
            is_public,
            ctx
        );

        let owner = profile.owner;
        transfer::transfer(profile, owner);
    }

    /// Snapshot avatar ref at passport claim. Display, bio, and conduct stay off-chain.
    public(package) fun mint_onboarding_profile(
        passport_obj: &passport::Passport,
        avatar_ref: vector<u8>,
        ctx: &mut TxContext
    ): Profile {
        let owner = tx_context::sender(ctx);
        let now = tx_context::epoch_timestamp_ms(ctx);
        let passport_id = passport::get_id(passport_obj);

        let profile = Profile {
            id: object::new(ctx),
            owner,
            passport_id,
            display_name: vector[],
            bio_ref: vector[],
            avatar_ref,
            metadata_ref: vector[],
            is_public: true,
            created_at_ms: now,
            updated_at_ms: now,
        };

        sui::event::emit(ProfileCreated {
            profile_id: object::uid_to_address(&profile.id),
            owner,
            passport_id,
            is_public: true,
        });

        profile
    }

    public(package) fun mint_profile(
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        display_name: vector<u8>,
        bio_ref: vector<u8>,
        avatar_ref: vector<u8>,
        metadata_ref: vector<u8>,
        is_public: bool,
        ctx: &mut TxContext
    ): Profile {
        let owner = tx_context::sender(ctx);

        assert_profile_access(
            passport_obj,
            conduct_status,
            ctx
        );

        let now = tx_context::epoch_timestamp_ms(ctx);
        let passport_id = passport::get_id(passport_obj);

        let profile = Profile {
            id: object::new(ctx),
            owner,
            passport_id,
            display_name,
            bio_ref,
            avatar_ref,
            metadata_ref,
            is_public,
            created_at_ms: now,
            updated_at_ms: now,
        };

        sui::event::emit(ProfileCreated {
            profile_id: object::uid_to_address(&profile.id),
            owner,
            passport_id,
            is_public,
        });

        profile
    }

    public(package) fun transfer_to_owner(profile: Profile, owner: address) {
        transfer::transfer(profile, owner);
    }

    // =========================================================
    // UPDATE PROFILE
    // Owner-managed update path.
    // =========================================================
    public fun update_profile(
        profile: &mut Profile,
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        display_name: vector<u8>,
        bio_ref: vector<u8>,
        avatar_ref: vector<u8>,
        metadata_ref: vector<u8>,
        is_public: bool,
        ctx: &TxContext
    ) {
        let sender = tx_context::sender(ctx);

        assert!(
            profile.owner == sender,
            errors::invalid_owner()
        );

        assert!(
            profile.passport_id == passport::get_id(passport_obj),
            errors::invalid_owner()
        );

        assert_profile_access(
            passport_obj,
            conduct_status,
            ctx
        );

        profile.display_name = display_name;
        profile.bio_ref = bio_ref;
        profile.avatar_ref = avatar_ref;
        profile.metadata_ref = metadata_ref;
        profile.is_public = is_public;
        profile.updated_at_ms = tx_context::epoch_timestamp_ms(ctx);

        sui::event::emit(ProfileUpdated {
            profile_id: object::uid_to_address(&profile.id),
            owner: sender,
            passport_id: profile.passport_id,
            is_public,
        });
    }

    // =========================================================
    // GETTERS
    // =========================================================
    public fun get_id(profile: &Profile): address {
        object::uid_to_address(&profile.id)
    }

    public fun get_owner(profile: &Profile): address {
        profile.owner
    }

    public fun get_passport_id(profile: &Profile): address {
        profile.passport_id
    }

    public fun get_display_name(profile: &Profile): vector<u8> {
        profile.display_name
    }

    public fun get_bio_ref(profile: &Profile): vector<u8> {
        profile.bio_ref
    }

    public fun get_avatar_ref(profile: &Profile): vector<u8> {
        profile.avatar_ref
    }

    public fun get_metadata_ref(profile: &Profile): vector<u8> {
        profile.metadata_ref
    }

    public fun get_is_public(profile: &Profile): bool {
        profile.is_public
    }
}