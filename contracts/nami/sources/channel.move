module nami::channel {

    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    use nami::conduct;
    use nami::errors;
    use nami::membership;
    use nami::passport;

    // =========================================================
    // MEMBERSHIP TIERS
    // =========================================================
    const ADVENTURER: u8 = 1;

    // =========================================================
    // CHANNEL OBJECT
    // =========================================================
    public struct Channel has key {
        id: UID,

        owner: address,
        owner_passport_id: address,

        name: vector<u8>,
        description: vector<u8>,

        /// Off-chain metadata reference.
        /// Future examples:
        /// - image/avatar URI
        /// - game profile metadata hash
        /// - channel rules document hash
        /// - Walrus object reference
        metadata_ref: vector<u8>,

        /// Public channels are intended for discovery.
        is_public: bool,

        /// Verified channels may receive higher trust in UI/discovery.
        /// Verification is authority-gated through admin.move.
        is_verified: bool,

        created_at_ms: u64,
        updated_at_ms: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct ChannelCreated has copy, drop {
        channel_id: address,
        owner: address,
        owner_passport_id: address,
        is_public: bool,
    }

    public struct ChannelUpdated has copy, drop {
        channel_id: address,
        owner: address,
        is_public: bool,
    }

    public struct ChannelVerified has copy, drop {
        channel_id: address,
        owner: address,
    }

    // =========================================================
    // ACCESS CHECK
    // =========================================================
    fun assert_can_use_channel_benefits(
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

        let tier = membership::get_effective_tier_with_conduct(
            passport_obj,
            conduct_status,
            ctx
        );

        assert!(
            tier >= ADVENTURER,
            errors::insufficient_tier()
        );
    }

    // =========================================================
    // CREATE CHANNEL
    // Adventurer, Pro, and Elite can create channels.
    // NPC cannot create channels.
    // Black Passport blocks channel creation through effective tier.
    // =========================================================
    public fun create_channel(
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        name: vector<u8>,
        description: vector<u8>,
        metadata_ref: vector<u8>,
        is_public: bool,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);

        assert_can_use_channel_benefits(
            passport_obj,
            conduct_status,
            ctx
        );

        let now = tx_context::epoch_timestamp_ms(ctx);

        let channel = Channel {
            id: object::new(ctx),

            owner,
            owner_passport_id: passport::get_id(passport_obj),

            name,
            description,
            metadata_ref,

            is_public,
            is_verified: false,

            created_at_ms: now,
            updated_at_ms: now,
        };

        let channel_id = object::uid_to_address(&channel.id);

        sui::event::emit(ChannelCreated {
            channel_id,
            owner,
            owner_passport_id: passport::get_id(passport_obj),
            is_public,
        });

        transfer::transfer(channel, owner);
    }

    // =========================================================
    // UPDATE CHANNEL
    // Owner-managed MVP update path.
    // =========================================================
    public fun update_channel(
        channel: &mut Channel,
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        name: vector<u8>,
        description: vector<u8>,
        metadata_ref: vector<u8>,
        is_public: bool,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        assert!(
            sender == channel.owner,
            errors::unauthorized()
        );

        assert_can_use_channel_benefits(
            passport_obj,
            conduct_status,
            ctx
        );

        assert!(
            channel.owner_passport_id == passport::get_id(passport_obj),
            errors::invalid_owner()
        );

        channel.name = name;
        channel.description = description;
        channel.metadata_ref = metadata_ref;
        channel.is_public = is_public;
        channel.updated_at_ms = tx_context::epoch_timestamp_ms(ctx);

        sui::event::emit(ChannelUpdated {
            channel_id: object::uid_to_address(&channel.id),
            owner: sender,
            is_public,
        });
    }

    // =========================================================
    // VERIFY CHANNEL
    // Package-only.
    // Exposed through admin.move.
    // =========================================================
    public(package) fun verify_channel(
        channel: &mut Channel,
        ctx: &TxContext
    ) {
        channel.is_verified = true;
        channel.updated_at_ms = tx_context::epoch_timestamp_ms(ctx);

        sui::event::emit(ChannelVerified {
            channel_id: object::uid_to_address(&channel.id),
            owner: channel.owner,
        });
    }

    // =========================================================
    // GETTERS
    // =========================================================
    public fun get_id(channel: &Channel): address {
        object::uid_to_address(&channel.id)
    }

    public fun get_owner(channel: &Channel): address {
        channel.owner
    }

    public fun get_owner_passport_id(channel: &Channel): address {
        channel.owner_passport_id
    }

    public fun get_name(channel: &Channel): vector<u8> {
        channel.name
    }

    public fun get_description(channel: &Channel): vector<u8> {
        channel.description
    }

    public fun get_metadata_ref(channel: &Channel): vector<u8> {
        channel.metadata_ref
    }

    public fun get_is_public(channel: &Channel): bool {
        channel.is_public
    }

    public fun get_is_verified(channel: &Channel): bool {
        channel.is_verified
    }
}