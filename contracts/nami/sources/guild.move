module nami::guild {

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
    const PRO: u8 = 2;
    const ELITE: u8 = 3;

    // =========================================================
    // GUILD LIMITS
    // =========================================================
    const ADVENTURER_GUILD_MEMBER_LIMIT: u64 = 25;
    const PRO_GUILD_MEMBER_LIMIT: u64 = 100;
    const ELITE_GUILD_MEMBER_LIMIT: u64 = 250;

    // =========================================================
    // GUILD ROLES
    // =========================================================
    const ROLE_MEMBER: u8 = 1;

    // =========================================================
    // GUILD OBJECT
    // =========================================================
    public struct Guild has key {
        id: UID,

        owner: address,
        owner_passport_id: address,

        name: vector<u8>,
        description: vector<u8>,

        is_public: bool,

        max_members: u64,

        /// Owner counts as the first member.
        member_count: u64,

        created_at_ms: u64,
        updated_at_ms: u64,
    }

    // =========================================================
    // GUILD MEMBER OBJECT
    // =========================================================
    public struct GuildMember has key {
        id: UID,

        guild_id: address,
        member: address,
        role: u8,

        joined_at_ms: u64,
    }

    // =========================================================
    // EVENTS
    // =========================================================
    public struct GuildCreated has copy, drop {
        guild_id: address,
        owner: address,
        owner_passport_id: address,
        max_members: u64,
        is_public: bool,
    }

    public struct GuildMemberAdded has copy, drop {
        guild_id: address,
        owner: address,
        member: address,
        role: u8,
    }

    public struct GuildUpdated has copy, drop {
        guild_id: address,
        owner: address,
        is_public: bool,
    }

    // =========================================================
    // HELPERS
    // =========================================================
    fun max_members_for_tier(tier: u8): u64 {
        if (tier == ADVENTURER) {
            ADVENTURER_GUILD_MEMBER_LIMIT
        } else if (tier == PRO) {
            PRO_GUILD_MEMBER_LIMIT
        } else if (tier == ELITE) {
            ELITE_GUILD_MEMBER_LIMIT
        } else {
            abort errors::insufficient_tier()
        }
    }

    fun assert_can_use_guild_benefits(
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        ctx: &TxContext
    ): u8 {
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
            tier == ADVENTURER || tier == PRO || tier == ELITE,
            errors::insufficient_tier()
        );

        tier
    }

    // =========================================================
    // CREATE GUILD
    // Adventurer, Pro, and Elite may create Guilds.
    // Black Passport is blocked through effective tier.
    // =========================================================
    public fun create_guild(
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        name: vector<u8>,
        description: vector<u8>,
        is_public: bool,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);

        let tier = assert_can_use_guild_benefits(
            passport_obj,
            conduct_status,
            ctx
        );

        let max_members = max_members_for_tier(tier);
        let now = tx_context::epoch_timestamp_ms(ctx);

        let guild = Guild {
            id: object::new(ctx),
            owner,
            owner_passport_id: passport::get_id(passport_obj),
            name,
            description,
            is_public,
            max_members,
            member_count: 1,
            created_at_ms: now,
            updated_at_ms: now,
        };

        let guild_id = object::uid_to_address(&guild.id);

        sui::event::emit(GuildCreated {
            guild_id,
            owner,
            owner_passport_id: passport::get_id(passport_obj),
            max_members,
            is_public,
        });

        transfer::transfer(guild, owner);
    }

    // =========================================================
    // ADD MEMBER
    // Guild owner can add a member.
    // This is owner-managed for MVP.
    // Future versions may support public join requests/invites.
    // =========================================================
    public fun add_member(
        guild: &mut Guild,
        passport_obj: &passport::Passport,
        conduct_status: &conduct::ConductStatus,
        member: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

               assert!(
            sender == guild.owner,
            errors::unauthorized()
        );

        assert!(
            guild.owner_passport_id == passport::get_id(passport_obj),
            errors::invalid_owner()
        );

        assert_can_use_guild_benefits(
            passport_obj,
            conduct_status,
            ctx
        );

        assert!(
            guild.member_count < guild.max_members,
            errors::guild_limit_reached()
        );

        guild.member_count = guild.member_count + 1;
        guild.updated_at_ms = tx_context::epoch_timestamp_ms(ctx);

        let guild_id = object::uid_to_address(&guild.id);

        let member_record = GuildMember {
            id: object::new(ctx),
            guild_id,
            member,
            role: ROLE_MEMBER,
            joined_at_ms: tx_context::epoch_timestamp_ms(ctx),
        };

        sui::event::emit(GuildMemberAdded {
            guild_id,
            owner: sender,
            member,
            role: ROLE_MEMBER,
        });

        transfer::transfer(member_record, member);
    }

    // =========================================================
    // UPDATE GUILD SETTINGS
    // MVP update path for simple public/private toggle and metadata.
    // =========================================================
    public fun update_guild(
        guild: &mut Guild,
        name: vector<u8>,
        description: vector<u8>,
        is_public: bool,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        assert!(
            sender == guild.owner,
            errors::unauthorized()
        );

        guild.name = name;
        guild.description = description;
        guild.is_public = is_public;
        guild.updated_at_ms = tx_context::epoch_timestamp_ms(ctx);

        sui::event::emit(GuildUpdated {
            guild_id: object::uid_to_address(&guild.id),
            owner: sender,
            is_public,
        });
    }

    // =========================================================
    // GETTERS
    // =========================================================
    public fun get_id(guild: &Guild): address {
        object::uid_to_address(&guild.id)
    }

    public fun get_owner(guild: &Guild): address {
        guild.owner
    }

    public fun get_owner_passport_id(guild: &Guild): address {
        guild.owner_passport_id
    }

    public fun get_name(guild: &Guild): vector<u8> {
        guild.name
    }

    public fun get_description(guild: &Guild): vector<u8> {
        guild.description
    }

    public fun get_is_public(guild: &Guild): bool {
        guild.is_public
    }

    public fun get_max_members(guild: &Guild): u64 {
        guild.max_members
    }

    public fun get_member_count(guild: &Guild): u64 {
        guild.member_count
    }

    public fun get_member_guild_id(member: &GuildMember): address {
        member.guild_id
    }

    public fun get_member_address(member: &GuildMember): address {
        member.member
    }

    public fun get_member_role(member: &GuildMember): u8 {
        member.role
    }
}