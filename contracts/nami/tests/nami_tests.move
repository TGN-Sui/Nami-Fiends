#[test_only]
module nami::nami_tests {

    use sui::test_scenario;

    use nami::identity;
    use nami::passport;
    use nami::badge;
    use nami::boost;
    use nami::verification;
    use nami::membership;
    use nami::badge_issuer;
    use nami::channel_access;
    use nami::conduct;
    use nami::moderation;
    use nami::admin;
    use nami::appeals;
    use nami::jury;
    use nami::squad;
    use nami::guild;
    use nami::title;
    use nami::cosmetics;
    use nami::recovery;
    use nami::channel;
    use nami::profile;

    /// Test addresses
    const USER: address = @0x1;
    const IDENTITY_ID: address = @0x100;
    const CHANNEL_ID: address = @0x200;
    const SPONSORED_USER: address = @0x2;

    /// Archetypes
    const ARCHETYPE_EXPLORER: u8 = 1;

    /// Title types
    const TITLE_GAMESTER: u8 = 1;
    const TITLE_FIEND: u8 = 4;

    /// Cosmetic types
    const COSMETIC_PROFILE_FRAME: u8 = 1;
    const PROFILE_FRAME_CODE: u64 = 1001;

    /// Badge types
    const COMPLETION_BADGE: u8 = 3;

    /// Badge Issuer types
    const ISSUER_NAMI_OFFICIAL: u8 = 1;
    const ISSUER_VERIFIED_CHANNEL: u8 = 3;

    /// Verification sources
    const SOURCE_NAMI: u8 = 1;
    const INVALID_SOURCE: u8 = 99;

    /// Membership tiers
    const NPC: u8 = 0;
    const ADVENTURER: u8 = 1;
    const PRO: u8 = 2;
    const ELITE: u8 = 3;

    /// Reputation tiers
    const NEWBIE: u8 = 0;
    const GAMESTER: u8 = 1;
    const GOBLIN: u8 = 2;
    const GOONIE: u8 = 3;
    const FIEND: u8 = 4;

    /// Conduct signals
    const GREEN: u8 = 1;
    const RED: u8 = 3;
    const BLACK: u8 = 4;

    /// Appeal statuses
    const APPEAL_APPROVED: u8 = 2;
    const APPEAL_DENIED: u8 = 3;

    /// Recovery statuses
    const RECOVERY_APPROVED: u8 = 2;
    const RECOVERY_DENIED: u8 = 3;

    /// ---------------------------------------------------------
    /// Identity + Passport creation
    /// Passport default tier should be NPC.
    /// ---------------------------------------------------------
    #[test]
    fun test_identity_and_passport_creation() {
        let mut scenario = test_scenario::begin(USER);

        identity::init_identity(test_scenario::ctx(&mut scenario));

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        assert!(passport::get_tier(&passport_obj) == NPC, 0);
        assert!(passport::get_level(&passport_obj) == 1, 1);
        assert!(passport::get_reputation(&passport_obj) == NEWBIE, 2);
        assert!(passport::get_xp(&passport_obj) == 0, 3);
        assert!(passport::get_badge_points(&passport_obj) == 0, 4);
        assert!(passport::get_level_progress(&passport_obj) == 0, 5);
        assert!(passport::get_prestige_points(&passport_obj) == 0, 6);

        test_scenario::return_to_sender(&scenario, identity_obj);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Verification authority flow:
    /// Identity + Passport starts NPC.
    /// verification.move upgrades NPC -> Adventurer.
    /// ---------------------------------------------------------
    #[test]
    fun test_verification_moves_npc_to_adventurer() {
        let mut scenario = test_scenario::begin(USER);

        identity::init_identity(test_scenario::ctx(&mut scenario));

        test_scenario::next_tx(&mut scenario, USER);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let identity_id = identity::get_id(&identity_obj);

        passport::init_passport(
            identity_id,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, identity_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        assert!(passport::get_tier(&passport_obj) == NPC, 10);

        verification::verify_to_adventurer(
            &identity_obj,
            &mut passport_obj,
            SOURCE_NAMI,
            test_scenario::ctx(&mut scenario)
        );

        assert!(passport::get_tier(&passport_obj) == ADVENTURER, 11);

        test_scenario::return_to_sender(&scenario, identity_obj);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let record =
            test_scenario::take_from_sender<verification::VerificationRecord>(&scenario);

        assert!(verification::get_record_owner(&record) == USER, 12);
        assert!(verification::get_record_source(&record) == SOURCE_NAMI, 13);
        assert!(verification::get_record_level(&record) == 1, 14);

        test_scenario::return_to_sender(&scenario, record);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Invalid verification source should fail.
    /// Expected abort:
    /// insufficient_verification = 21
    /// ---------------------------------------------------------
    #[test, expected_failure(abort_code = 21)]
    fun test_invalid_verification_source_fails() {
        let mut scenario = test_scenario::begin(USER);

        identity::init_identity(test_scenario::ctx(&mut scenario));

        test_scenario::next_tx(&mut scenario, USER);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let identity_id = identity::get_id(&identity_obj);

        passport::init_passport(
            identity_id,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, identity_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        verification::verify_to_adventurer(
            &identity_obj,
            &mut passport_obj,
            INVALID_SOURCE,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, identity_obj);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Passport tier upgrade flow:
    /// NPC -> Adventurer -> Pro -> Elite
    /// Adventurer transition goes through verification.move.
    /// ---------------------------------------------------------
    #[test]
    fun test_passport_tier_upgrade_flow() {
        let mut scenario = test_scenario::begin(USER);

        identity::init_identity(test_scenario::ctx(&mut scenario));

        test_scenario::next_tx(&mut scenario, USER);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let identity_id = identity::get_id(&identity_obj);

        passport::init_passport(
            identity_id,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, identity_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        assert!(passport::get_tier(&passport_obj) == NPC, 20);

        verification::verify_to_adventurer(
            &identity_obj,
            &mut passport_obj,
            SOURCE_NAMI,
            test_scenario::ctx(&mut scenario)
        );

        assert!(passport::get_tier(&passport_obj) == ADVENTURER, 21);

       membership::upgrade_to_pro(
    &mut passport_obj,
    0,
    test_scenario::ctx(&mut scenario)
        );
        assert!(passport::get_tier(&passport_obj) == PRO, 22);

        membership::upgrade_to_elite(
    &mut passport_obj,
    0,
    test_scenario::ctx(&mut scenario)
        );
        assert!(passport::get_tier(&passport_obj) == ELITE, 23);

        test_scenario::return_to_sender(&scenario, identity_obj);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let record =
            test_scenario::take_from_sender<verification::VerificationRecord>(&scenario);

        test_scenario::return_to_sender(&scenario, record);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Badge minting updates Passport badge points and XP.
    /// ---------------------------------------------------------
    #[test]
    fun test_badge_mint_updates_passport_points() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        badge::mint_badge(
            &mut passport_obj,
            USER,
            COMPLETION_BADGE,
            b"completion-badge",
            test_scenario::ctx(&mut scenario)
        );

        assert!(passport::get_badge_points(&passport_obj) == 3, 30);
        assert!(passport::get_xp(&passport_obj) == 3, 31);
        assert!(passport::get_reputation(&passport_obj) == NEWBIE, 32);

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let badge_obj =
            test_scenario::take_from_sender<badge::Badge>(&scenario);

        test_scenario::return_to_sender(&scenario, badge_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Badge issuer can issue an approved Completion Badge.
    /// ---------------------------------------------------------
    #[test]
    fun test_badge_issuer_can_issue_completion_badge() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        badge_issuer::create_issuer_cap(
            USER,
            CHANNEL_ID,
            ISSUER_NAMI_OFFICIAL,
            true,
            true,
            true,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let issuer_cap =
            test_scenario::take_from_sender<badge_issuer::BadgeIssuerCap>(&scenario);

        badge_issuer::issue_badge(
            &issuer_cap,
            &mut passport_obj,
            USER,
            COMPLETION_BADGE,
            b"issuer-completion-badge",
            test_scenario::ctx(&mut scenario)
        );

        assert!(passport::get_badge_points(&passport_obj) == 3, 60);
        assert!(passport::get_xp(&passport_obj) == 3, 61);

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, issuer_cap);

        test_scenario::next_tx(&mut scenario, USER);

        let badge_obj =
            test_scenario::take_from_sender<badge::Badge>(&scenario);

        test_scenario::return_to_sender(&scenario, badge_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Badge issuer without Completion permission cannot issue
    /// Completion Badges.
    /// Expected abort:
    /// badge_issuer_permission_denied = 92
    /// ---------------------------------------------------------
    #[test, expected_failure(abort_code = 92)]
    fun test_badge_issuer_cannot_issue_completion_without_permission() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        badge_issuer::create_issuer_cap(
            USER,
            CHANNEL_ID,
            ISSUER_VERIFIED_CHANNEL,
            true,
            true,
            false,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let issuer_cap =
            test_scenario::take_from_sender<badge_issuer::BadgeIssuerCap>(&scenario);

        badge_issuer::issue_badge(
            &issuer_cap,
            &mut passport_obj,
            USER,
            COMPLETION_BADGE,
            b"blocked-completion-badge",
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, issuer_cap);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Badge point thresholds update reputation using curved model.
    /// ---------------------------------------------------------
    #[test]
    fun test_badge_points_update_reputation() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::apply_badge_points(&mut passport_obj, 90);
        assert!(passport::get_reputation(&passport_obj) == GAMESTER, 40);

        passport::apply_badge_points(&mut passport_obj, 335);
        assert!(passport::get_badge_points(&passport_obj) == 425, 41);
        assert!(passport::get_reputation(&passport_obj) == GOBLIN, 42);

        passport::apply_badge_points(&mut passport_obj, 425);
        assert!(passport::get_badge_points(&passport_obj) == 850, 43);
        assert!(passport::get_reputation(&passport_obj) == GOONIE, 44);

        passport::apply_badge_points(&mut passport_obj, 750);
        assert!(passport::get_badge_points(&passport_obj) == 1600, 45);
        assert!(passport::get_reputation(&passport_obj) == FIEND, 46);

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// NPC cannot boost.
    /// Expected abort:
    /// boost_unavailable = 60
    /// ---------------------------------------------------------
    #[test, expected_failure(abort_code = 60)]
    fun test_npc_cannot_boost() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        boost::use_boost(
            &passport_obj,
            CHANNEL_ID,
            1,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Adventurer can boost after verification.
    /// ---------------------------------------------------------
    #[test]
    fun test_adventurer_can_boost_after_verification() {
        let mut scenario = test_scenario::begin(USER);

        identity::init_identity(test_scenario::ctx(&mut scenario));

        test_scenario::next_tx(&mut scenario, USER);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let identity_id = identity::get_id(&identity_obj);

        passport::init_passport(
            identity_id,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, identity_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        verification::verify_to_adventurer(
            &identity_obj,
            &mut passport_obj,
            SOURCE_NAMI,
            test_scenario::ctx(&mut scenario)
        );

        assert!(passport::get_tier(&passport_obj) == ADVENTURER, 50);

        boost::use_boost(
            &passport_obj,
            CHANNEL_ID,
            1,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, identity_obj);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let record =
            test_scenario::take_from_sender<verification::VerificationRecord>(&scenario);

        let boost_obj =
            test_scenario::take_from_sender<boost::Boost>(&scenario);

        test_scenario::return_to_sender(&scenario, record);
        test_scenario::return_to_sender(&scenario, boost_obj);

        test_scenario::end(scenario);
    }
        /// ---------------------------------------------------------
    /// Channel policy allows NPC chat when toggle is enabled.
    /// ---------------------------------------------------------
    #[test]
    fun test_channel_allows_npc_chat_when_enabled() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        channel_access::create_policy(
            CHANNEL_ID,
            true,
            NPC,
            NEWBIE,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let policy =
            test_scenario::take_from_sender<channel_access::ChannelAccessPolicy>(&scenario);

        assert!(
            channel_access::can_chat(&passport_obj, &policy),
            70
        );

        channel_access::assert_can_chat(&passport_obj, &policy);

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, policy);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Channel policy blocks NPC chat when toggle is disabled.
    /// Expected abort:
    /// insufficient_tier = 31
    /// ---------------------------------------------------------
    #[test, expected_failure(abort_code = 31)]
    fun test_channel_blocks_npc_chat_when_disabled() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        channel_access::create_policy(
            CHANNEL_ID,
            false,
            NPC,
            NEWBIE,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let policy =
            test_scenario::take_from_sender<channel_access::ChannelAccessPolicy>(&scenario);

        channel_access::assert_can_chat(&passport_obj, &policy);

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, policy);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Adventurer can chat when NPC chat is disabled,
    /// as long as the minimum tier is Adventurer.
    /// ---------------------------------------------------------
    #[test]
    fun test_adventurer_can_chat_when_npc_chat_disabled() {
        let mut scenario = test_scenario::begin(USER);

        identity::init_identity(test_scenario::ctx(&mut scenario));

        test_scenario::next_tx(&mut scenario, USER);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let identity_id = identity::get_id(&identity_obj);

        passport::init_passport(
            identity_id,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, identity_obj);

        channel_access::create_policy(
            CHANNEL_ID,
            false,
            ADVENTURER,
            NEWBIE,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let policy =
            test_scenario::take_from_sender<channel_access::ChannelAccessPolicy>(&scenario);

        verification::verify_to_adventurer(
            &identity_obj,
            &mut passport_obj,
            SOURCE_NAMI,
            test_scenario::ctx(&mut scenario)
        );

        assert!(passport::get_tier(&passport_obj) == ADVENTURER, 71);
        assert!(channel_access::can_chat(&passport_obj, &policy), 72);

        channel_access::assert_can_chat(&passport_obj, &policy);

        test_scenario::return_to_sender(&scenario, identity_obj);
        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, policy);

        test_scenario::next_tx(&mut scenario, USER);

        let record =
            test_scenario::take_from_sender<verification::VerificationRecord>(&scenario);

        test_scenario::return_to_sender(&scenario, record);

        test_scenario::end(scenario);
    }
        /// ---------------------------------------------------------
    /// Conduct status can be created with Green signal.
    /// ---------------------------------------------------------
    #[test]
    fun test_conduct_status_created_green() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        assert!(conduct::get_signal(&status) == GREEN, 80);
        assert!(conduct::is_green(&status), 81);
        assert!(conduct::has_active_benefits(
            &status,
            test_scenario::ctx(&mut scenario)
        ), 82);

        test_scenario::return_to_sender(&scenario, status);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// User can update Conduct Signal from Green to Red.
    /// Red is not punishment.
    /// ---------------------------------------------------------
    #[test]
    fun test_user_can_update_conduct_signal_to_red() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let mut status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        conduct::update_signal(
            &mut status,
            RED,
            test_scenario::ctx(&mut scenario)
        );

        assert!(conduct::get_signal(&status) == RED, 83);
        assert!(conduct::is_red(&status), 84);
        assert!(conduct::has_active_benefits(
            &status,
            test_scenario::ctx(&mut scenario)
        ), 85);

        test_scenario::return_to_sender(&scenario, status);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// User cannot choose Black Signal.
    /// Expected abort:
    /// invalid_conduct_signal = 100
    /// ---------------------------------------------------------
    #[test, expected_failure(abort_code = 100)]
    fun test_user_cannot_select_black_signal() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        conduct::create_status(
            &passport_obj,
            BLACK,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Package authority can down Passport into Black Signal.
    /// Active Black Signal disables active benefits.
    /// ---------------------------------------------------------
    #[test]
    fun test_black_conduct_blocks_active_benefits() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let mut status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        conduct::down_passport(
            &mut status,
            1,
            999999999999,
            test_scenario::ctx(&mut scenario)
        );

        assert!(conduct::get_signal(&status) == BLACK, 86);
        assert!(conduct::is_black(&status), 87);
        assert!(!conduct::has_active_benefits(
            &status,
            test_scenario::ctx(&mut scenario)
        ), 88);

        test_scenario::return_to_sender(&scenario, status);

        test_scenario::end(scenario);
    }
        /// ---------------------------------------------------------
    /// Black Conduct forces effective tier to NPC.
    /// This proves Black Passport temporarily removes active benefits.
    /// ---------------------------------------------------------
    #[test]
    fun test_black_conduct_forces_effective_tier_to_npc() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::verify_to_adventurer(&mut passport_obj);

        assert!(passport::get_tier(&passport_obj) == ADVENTURER, 90);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let mut status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        conduct::down_passport(
            &mut status,
            1,
            999999999999,
            test_scenario::ctx(&mut scenario)
        );

        let effective_tier = membership::get_effective_tier_with_conduct(
            &passport_obj,
            &status,
            test_scenario::ctx(&mut scenario)
        );

        assert!(effective_tier == NPC, 91);

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Black Conduct blocks channel chat even when NPC chat is allowed.
    /// Black Passport is stronger than normal channel permissions.
    /// ---------------------------------------------------------
    #[test]
    fun test_black_conduct_blocks_channel_chat_even_if_npc_allowed() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        channel_access::create_policy(
            CHANNEL_ID,
            true,
            NPC,
            NEWBIE,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let policy =
            test_scenario::take_from_sender<channel_access::ChannelAccessPolicy>(&scenario);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, policy);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let policy =
            test_scenario::take_from_sender<channel_access::ChannelAccessPolicy>(&scenario);

        let mut status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        conduct::down_passport(
            &mut status,
            1,
            999999999999,
            test_scenario::ctx(&mut scenario)
        );

        assert!(
            !channel_access::can_chat_with_conduct(
                &passport_obj,
                &status,
                &policy,
                test_scenario::ctx(&mut scenario)
            ),
            92
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, policy);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::end(scenario);
    }

        /// ---------------------------------------------------------
    /// Moderation can issue a warning record.
    /// ---------------------------------------------------------
    #[test]
    fun test_moderation_can_issue_warning_record() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        moderation::issue_warning(
            USER,
            &passport_obj,
            42,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let record =
            test_scenario::take_from_sender<moderation::ModerationRecord>(&scenario);

        assert!(moderation::get_target_owner(&record) == USER, 100);
        assert!(moderation::get_reason_code(&record) == 42, 101);
        assert!(moderation::is_warning(&record), 102);

        test_scenario::return_to_sender(&scenario, record);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Moderation can issue Black Passport through Conduct.
    /// This confirms moderation.move is now the authority wrapper.
    /// ---------------------------------------------------------
    #[test]
    fun test_moderation_can_issue_black_passport() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let mut status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        moderation::issue_black_passport(
            USER,
            &passport_obj,
            &mut status,
            7,
            999999999999,
            test_scenario::ctx(&mut scenario)
        );

        assert!(conduct::is_black(&status), 103);
        assert!(!conduct::has_active_benefits(
            &status,
            test_scenario::ctx(&mut scenario)
        ), 104);

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let record =
            test_scenario::take_from_sender<moderation::ModerationRecord>(&scenario);

        assert!(moderation::is_black_passport(&record), 105);
        assert!(moderation::get_reason_code(&record) == 7, 106);
        assert!(moderation::get_expires_at_ms(&record) == 999999999999, 107);

        test_scenario::return_to_sender(&scenario, record);

        test_scenario::end(scenario);
    }

        /// ---------------------------------------------------------
    /// Active mute blocks channel chat.
    /// ---------------------------------------------------------
    #[test]
    fun test_moderation_mute_blocks_channel_chat() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        channel_access::create_policy(
            CHANNEL_ID,
            true,
            NPC,
            NEWBIE,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let policy =
            test_scenario::take_from_sender<channel_access::ChannelAccessPolicy>(&scenario);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        moderation::issue_mute(
            USER,
            &passport_obj,
            CHANNEL_ID,
            12,
            999999999999,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, policy);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let policy =
            test_scenario::take_from_sender<channel_access::ChannelAccessPolicy>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        let record =
            test_scenario::take_from_sender<moderation::ModerationRecord>(&scenario);

        assert!(
            moderation::is_active_mute(
                &record,
                &passport_obj,
                CHANNEL_ID,
                test_scenario::ctx(&mut scenario)
            ),
            110
        );

        assert!(
            !channel_access::can_chat_with_conduct_and_moderation(
                &passport_obj,
                &status,
                &policy,
                &record,
                test_scenario::ctx(&mut scenario)
            ),
            111
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, policy);
        test_scenario::return_to_sender(&scenario, status);
        test_scenario::return_to_sender(&scenario, record);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Active channel ban blocks channel chat.
    /// ---------------------------------------------------------
    #[test]
    fun test_moderation_channel_ban_blocks_channel_chat() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        channel_access::create_policy(
            CHANNEL_ID,
            true,
            NPC,
            NEWBIE,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let policy =
            test_scenario::take_from_sender<channel_access::ChannelAccessPolicy>(&scenario);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        moderation::issue_channel_ban(
            USER,
            &passport_obj,
            CHANNEL_ID,
            13,
            999999999999,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, policy);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let policy =
            test_scenario::take_from_sender<channel_access::ChannelAccessPolicy>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        let record =
            test_scenario::take_from_sender<moderation::ModerationRecord>(&scenario);

        assert!(
            moderation::is_active_channel_ban(
                &record,
                &passport_obj,
                CHANNEL_ID,
                test_scenario::ctx(&mut scenario)
            ),
            112
        );

        assert!(
            !channel_access::can_chat_with_conduct_and_moderation(
                &passport_obj,
                &status,
                &policy,
                &record,
                test_scenario::ctx(&mut scenario)
            ),
            113
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, policy);
        test_scenario::return_to_sender(&scenario, status);
        test_scenario::return_to_sender(&scenario, record);

        test_scenario::end(scenario);
    }

        /// ---------------------------------------------------------
    /// AdminCap can approve a BadgeIssuerCap.
    /// ---------------------------------------------------------
    #[test]
    fun test_admin_can_approve_badge_issuer() {
        let mut scenario = test_scenario::begin(USER);

        admin::init_for_testing(
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        admin::approve_badge_issuer(
            &admin_cap,
            USER,
            CHANNEL_ID,
            ISSUER_NAMI_OFFICIAL,
            true,
            true,
            true,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);

        test_scenario::next_tx(&mut scenario, USER);

        let issuer_cap =
            test_scenario::take_from_sender<badge_issuer::BadgeIssuerCap>(&scenario);

        assert!(badge_issuer::get_issuer_owner(&issuer_cap) == USER, 120);
        assert!(badge_issuer::get_issuer_id(&issuer_cap) == CHANNEL_ID, 121);
        assert!(badge_issuer::can_issue_completion(&issuer_cap), 122);

        test_scenario::return_to_sender(&scenario, issuer_cap);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// AdminCap can upgrade Adventurer to Pro and Elite.
    /// ---------------------------------------------------------
    #[test]
    fun test_admin_can_upgrade_membership_to_pro_and_elite() {
        let mut scenario = test_scenario::begin(USER);

        admin::init_for_testing(
            test_scenario::ctx(&mut scenario)
        );

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::verify_to_adventurer(&mut passport_obj);
        assert!(passport::get_tier(&passport_obj) == ADVENTURER, 123);

        admin::upgrade_to_pro(
            &admin_cap,
            &mut passport_obj,
            0,
            test_scenario::ctx(&mut scenario)
        );

        assert!(passport::get_tier(&passport_obj) == PRO, 124);

        admin::upgrade_to_elite(
            &admin_cap,
            &mut passport_obj,
            0,
            test_scenario::ctx(&mut scenario)
        );

        assert!(passport::get_tier(&passport_obj) == ELITE, 125);

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// AdminCap can issue a mute that blocks channel chat.
    /// ---------------------------------------------------------
    #[test]
    fun test_admin_can_issue_mute_that_blocks_channel_chat() {
        let mut scenario = test_scenario::begin(USER);

        admin::init_for_testing(
            test_scenario::ctx(&mut scenario)
        );

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        channel_access::create_policy(
            CHANNEL_ID,
            true,
            NPC,
            NEWBIE,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let policy =
            test_scenario::take_from_sender<channel_access::ChannelAccessPolicy>(&scenario);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        admin::issue_mute(
            &admin_cap,
            USER,
            &passport_obj,
            CHANNEL_ID,
            99,
            999999999999,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, policy);

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let policy =
            test_scenario::take_from_sender<channel_access::ChannelAccessPolicy>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        let record =
            test_scenario::take_from_sender<moderation::ModerationRecord>(&scenario);

        assert!(moderation::is_mute(&record), 126);
        assert!(
            !channel_access::can_chat_with_conduct_and_moderation(
                &passport_obj,
                &status,
                &policy,
                &record,
                test_scenario::ctx(&mut scenario)
            ),
            127
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, policy);
        test_scenario::return_to_sender(&scenario, status);
        test_scenario::return_to_sender(&scenario, record);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// User can open an appeal for their own moderation record.
    /// ---------------------------------------------------------
    #[test]
        fun test_user_can_open_appeal_for_moderation_record() {
            let mut scenario = test_scenario::begin(USER);

            passport::init_passport(
                IDENTITY_ID,
                ARCHETYPE_EXPLORER,
                test_scenario::ctx(&mut scenario)
            );

            test_scenario::next_tx(&mut scenario, USER);

            let passport_obj =
                test_scenario::take_from_sender<passport::Passport>(&scenario);

            moderation::issue_warning(
                USER,
                &passport_obj,
                55,
                test_scenario::ctx(&mut scenario)
            );

            test_scenario::return_to_sender(&scenario, passport_obj);

            test_scenario::next_tx(&mut scenario, USER);

            let passport_obj =
                test_scenario::take_from_sender<passport::Passport>(&scenario);

            let record =
                test_scenario::take_from_sender<moderation::ModerationRecord>(&scenario);

            appeals::open_appeal(
                &passport_obj,
                &record,
                b"appeal-reference",
                test_scenario::ctx(&mut scenario)
            );

            test_scenario::return_to_sender(&scenario, passport_obj);
            test_scenario::return_to_sender(&scenario, record);

            test_scenario::next_tx(&mut scenario, USER);

            let appeal =
                test_scenario::take_from_sender<appeals::AppealCase>(&scenario);

            assert!(appeals::get_appellant(&appeal) == USER, 130);
            assert!(appeals::get_moderation_reason_code(&appeal) == 55, 131);
            assert!(appeals::is_open(&appeal), 132);

            test_scenario::return_to_sender(&scenario, appeal);

            test_scenario::end(scenario);
        }

    /// ---------------------------------------------------------
    /// Admin can resolve an appeal.
    /// ---------------------------------------------------------
    #[test]
        fun test_admin_can_resolve_appeal() {
            let mut scenario = test_scenario::begin(USER);

            admin::init_for_testing(
                test_scenario::ctx(&mut scenario)
            );

            passport::init_passport(
                IDENTITY_ID,
                ARCHETYPE_EXPLORER,
                test_scenario::ctx(&mut scenario)
            );

            test_scenario::next_tx(&mut scenario, USER);

            let admin_cap =
                test_scenario::take_from_sender<admin::AdminCap>(&scenario);

            let passport_obj =
                test_scenario::take_from_sender<passport::Passport>(&scenario);

            admin::issue_warning(
                &admin_cap,
                USER,
                &passport_obj,
                77,
                test_scenario::ctx(&mut scenario)
            );

            test_scenario::return_to_sender(&scenario, admin_cap);
            test_scenario::return_to_sender(&scenario, passport_obj);

            test_scenario::next_tx(&mut scenario, USER);

            let admin_cap =
                test_scenario::take_from_sender<admin::AdminCap>(&scenario);

            let passport_obj =
                test_scenario::take_from_sender<passport::Passport>(&scenario);

            let record =
                test_scenario::take_from_sender<moderation::ModerationRecord>(&scenario);

            appeals::open_appeal(
                &passport_obj,
                &record,
                b"appeal-admin-resolution",
                test_scenario::ctx(&mut scenario)
            );

            test_scenario::return_to_sender(&scenario, admin_cap);
            test_scenario::return_to_sender(&scenario, passport_obj);
            test_scenario::return_to_sender(&scenario, record);

            test_scenario::next_tx(&mut scenario, USER);

            let admin_cap =
                test_scenario::take_from_sender<admin::AdminCap>(&scenario);

            let mut appeal =
                test_scenario::take_from_sender<appeals::AppealCase>(&scenario);

            admin::resolve_appeal(
                &admin_cap,
                &mut appeal,
                APPEAL_APPROVED,
                9001,
                test_scenario::ctx(&mut scenario)
            );

            assert!(appeals::is_approved(&appeal), 133);
            assert!(appeals::get_resolution_code(&appeal) == 9001, 134);

            test_scenario::return_to_sender(&scenario, admin_cap);
            test_scenario::return_to_sender(&scenario, appeal);

            test_scenario::end(scenario);
        }

            /// ---------------------------------------------------------
    /// Admin can open a JuryCase for an open appeal.
    /// ---------------------------------------------------------
    #[test]
    fun test_admin_can_open_jury_case_for_appeal() {
        let mut scenario = test_scenario::begin(USER);

        admin::init_for_testing(
            test_scenario::ctx(&mut scenario)
        );

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        admin::issue_warning(
            &admin_cap,
            USER,
            &passport_obj,
            88,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let record =
            test_scenario::take_from_sender<moderation::ModerationRecord>(&scenario);

        appeals::open_appeal(
            &passport_obj,
            &record,
            b"jury-open-reference",
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, record);

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let appeal =
            test_scenario::take_from_sender<appeals::AppealCase>(&scenario);

        admin::open_jury_case(
            &admin_cap,
            &appeal,
            3,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, appeal);

        test_scenario::next_tx(&mut scenario, USER);

        let jury_case =
            test_scenario::take_from_sender<jury::JuryCase>(&scenario);

        assert!(jury::is_open(&jury_case), 140);
        assert!(jury::get_required_votes(&jury_case) == 3, 141);
        assert!(jury::get_approve_votes(&jury_case) == 0, 142);
        assert!(jury::get_deny_votes(&jury_case) == 0, 143);
        assert!(jury::get_modify_votes(&jury_case) == 0, 144);

        test_scenario::return_to_sender(&scenario, jury_case);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Pro juror can vote and admin can close JuryCase.
    /// This uses APPEAL_DENIED so the reserved constant is no longer unused.
    /// ---------------------------------------------------------
    #[test]
    fun test_pro_juror_can_vote_and_admin_closes_jury_case_denied() {
        let mut scenario = test_scenario::begin(USER);

        admin::init_for_testing(
            test_scenario::ctx(&mut scenario)
        );

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::verify_to_adventurer(&mut passport_obj);

        admin::upgrade_to_pro(
            &admin_cap,
            &mut passport_obj,
            0,
            test_scenario::ctx(&mut scenario)
        );

        assert!(passport::get_tier(&passport_obj) == PRO, 145);

        admin::issue_warning(
            &admin_cap,
            USER,
            &passport_obj,
            99,
            test_scenario::ctx(&mut scenario)
        );

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let record =
            test_scenario::take_from_sender<moderation::ModerationRecord>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        appeals::open_appeal(
            &passport_obj,
            &record,
            b"jury-denied-reference",
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, record);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let record =
            test_scenario::take_from_sender<moderation::ModerationRecord>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        let appeal =
            test_scenario::take_from_sender<appeals::AppealCase>(&scenario);

        admin::open_jury_case(
            &admin_cap,
            &appeal,
            1,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, record);
        test_scenario::return_to_sender(&scenario, status);
        test_scenario::return_to_sender(&scenario, appeal);

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let record =
            test_scenario::take_from_sender<moderation::ModerationRecord>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        let appeal =
            test_scenario::take_from_sender<appeals::AppealCase>(&scenario);

        let mut jury_case =
            test_scenario::take_from_sender<jury::JuryCase>(&scenario);

        assert!(
            jury::is_eligible_juror(
                &passport_obj,
                &status,
                test_scenario::ctx(&mut scenario)
            ),
            146
        );

        jury::submit_vote(
            &mut jury_case,
            &passport_obj,
            &status,
            APPEAL_DENIED,
            test_scenario::ctx(&mut scenario)
        );

        assert!(jury::get_deny_votes(&jury_case) == 1, 147);

        admin::close_jury_case(
            &admin_cap,
            &mut jury_case,
            test_scenario::ctx(&mut scenario)
        );

        assert!(jury::is_closed(&jury_case), 148);
        assert!(jury::get_final_recommendation(&jury_case) == APPEAL_DENIED, 149);

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, record);
        test_scenario::return_to_sender(&scenario, status);
        test_scenario::return_to_sender(&scenario, appeal);
        test_scenario::return_to_sender(&scenario, jury_case);

        test_scenario::next_tx(&mut scenario, USER);

        let receipt =
            test_scenario::take_from_sender<jury::JuryVoteReceipt>(&scenario);

        assert!(jury::get_vote_receipt_vote(&receipt) == APPEAL_DENIED, 150);

        test_scenario::return_to_sender(&scenario, receipt);

        test_scenario::end(scenario);
    }

        /// ---------------------------------------------------------
    /// Pro member can create a Squad.
    /// ---------------------------------------------------------
    #[test]
    fun test_pro_member_can_create_squad() {
        let mut scenario = test_scenario::begin(USER);

        admin::init_for_testing(
            test_scenario::ctx(&mut scenario)
        );

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::verify_to_adventurer(&mut passport_obj);

        admin::upgrade_to_pro(
            &admin_cap,
            &mut passport_obj,
            0,
            test_scenario::ctx(&mut scenario)
        );

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        squad::create_squad(
            &passport_obj,
            &status,
            b"goonie-squad",
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let squad_obj =
            test_scenario::take_from_sender<squad::Squad>(&scenario);

        assert!(squad::get_owner(&squad_obj) == USER, 160);
        assert!(squad::get_max_slots(&squad_obj) == 3, 161);
        assert!(squad::get_member_count(&squad_obj) == 0, 162);

        test_scenario::return_to_sender(&scenario, squad_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// NPC cannot create a Squad.
    /// Expected abort:
    /// insufficient_tier = 31
    /// ---------------------------------------------------------
    #[test, expected_failure(abort_code = 31)]
    fun test_npc_cannot_create_squad() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        squad::create_squad(
            &passport_obj,
            &status,
            b"npc-squad",
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Squad owner can sponsor a member.
    /// ---------------------------------------------------------
    #[test]
    fun test_squad_owner_can_sponsor_member() {
        let mut scenario = test_scenario::begin(USER);

        admin::init_for_testing(
            test_scenario::ctx(&mut scenario)
        );

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::verify_to_adventurer(&mut passport_obj);

        admin::upgrade_to_pro(
            &admin_cap,
            &mut passport_obj,
            0,
            test_scenario::ctx(&mut scenario)
        );

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        squad::create_squad(
            &passport_obj,
            &status,
            b"sponsor-squad",
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        let mut squad_obj =
            test_scenario::take_from_sender<squad::Squad>(&scenario);

        squad::sponsor_member(
            &mut squad_obj,
            &passport_obj,
            &status,
            SPONSORED_USER,
            test_scenario::ctx(&mut scenario)
        );

        assert!(squad::get_member_count(&squad_obj) == 1, 163);

        let squad_id = squad::get_id(&squad_obj);

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);
        test_scenario::return_to_sender(&scenario, squad_obj);

        test_scenario::next_tx(&mut scenario, SPONSORED_USER);

        let member_record =
            test_scenario::take_from_sender<squad::SquadMember>(&scenario);

        assert!(squad::get_member_squad_id(&member_record) == squad_id, 164);
        assert!(squad::get_member_sponsor(&member_record) == USER, 165);
        assert!(squad::get_member_address(&member_record) == SPONSORED_USER, 166);

        test_scenario::return_to_sender(&scenario, member_record);

        test_scenario::end(scenario);
    }

        /// ---------------------------------------------------------
    /// Adventurer can create a Guild.
    /// Guilds are larger communities than Squads.
    /// ---------------------------------------------------------
    #[test]
    fun test_adventurer_can_create_guild() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::verify_to_adventurer(&mut passport_obj);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        guild::create_guild(
            &passport_obj,
            &status,
            b"goonie-guild",
            b"Guild for gamers",
            true,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let guild_obj =
            test_scenario::take_from_sender<guild::Guild>(&scenario);

        assert!(guild::get_owner(&guild_obj) == USER, 170);
        assert!(guild::get_max_members(&guild_obj) == 25, 171);
        assert!(guild::get_member_count(&guild_obj) == 1, 172);
        assert!(guild::get_is_public(&guild_obj), 173);

        test_scenario::return_to_sender(&scenario, guild_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// NPC cannot create a Guild.
    /// Expected abort:
    /// insufficient_tier = 31
    /// ---------------------------------------------------------
    #[test, expected_failure(abort_code = 31)]
    fun test_npc_cannot_create_guild() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        guild::create_guild(
            &passport_obj,
            &status,
            b"npc-guild",
            b"NPC should not create this",
            true,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Guild owner can add a member.
    /// ---------------------------------------------------------
    #[test]
    fun test_guild_owner_can_add_member() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::verify_to_adventurer(&mut passport_obj);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        guild::create_guild(
            &passport_obj,
            &status,
            b"member-guild",
            b"Guild with members",
            true,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        let mut guild_obj =
            test_scenario::take_from_sender<guild::Guild>(&scenario);

        guild::add_member(
            &mut guild_obj,
            &passport_obj,
            &status,
            SPONSORED_USER,
            test_scenario::ctx(&mut scenario)
        );

        assert!(guild::get_member_count(&guild_obj) == 2, 174);

        let guild_id = guild::get_id(&guild_obj);

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);
        test_scenario::return_to_sender(&scenario, guild_obj);

        test_scenario::next_tx(&mut scenario, SPONSORED_USER);

        let member_record =
            test_scenario::take_from_sender<guild::GuildMember>(&scenario);

        assert!(guild::get_member_guild_id(&member_record) == guild_id, 175);
        assert!(guild::get_member_address(&member_record) == SPONSORED_USER, 176);
        assert!(guild::get_member_role(&member_record) == 1, 177);

        test_scenario::return_to_sender(&scenario, member_record);

        test_scenario::end(scenario);
    }

        /// ---------------------------------------------------------
    /// User can claim a Gamester title after earning reputation.
    /// ---------------------------------------------------------
    #[test]
    fun test_user_can_claim_gamester_title_from_reputation() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::apply_badge_points(&mut passport_obj, 90);

        assert!(passport::get_reputation(&passport_obj) == GAMESTER, 180);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        title::claim_reputation_title(
            &passport_obj,
            &status,
            TITLE_GAMESTER,
            1,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let earned_title =
            test_scenario::take_from_sender<title::EarnedTitle>(&scenario);

        assert!(title::get_title_owner(&earned_title) == USER, 181);
        assert!(title::get_title_type(&earned_title) == TITLE_GAMESTER, 182);
        assert!(title::get_title_source_code(&earned_title) == 1, 183);

        test_scenario::return_to_sender(&scenario, earned_title);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// User cannot claim a Fiend title without Fiend reputation.
    /// Expected abort:
    /// title_not_earned = 141
    /// ---------------------------------------------------------
    #[test, expected_failure(abort_code = 141)]
    fun test_user_cannot_claim_fiend_title_without_reputation() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        title::claim_reputation_title(
            &passport_obj,
            &status,
            TITLE_FIEND,
            4,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// User can create a TitleDisplay and equip an owned title.
    /// ---------------------------------------------------------
    #[test]
    fun test_user_can_equip_earned_title() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::apply_badge_points(&mut passport_obj, 90);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        title::create_title_display(
            &passport_obj,
            &status,
            test_scenario::ctx(&mut scenario)
        );

        title::claim_reputation_title(
            &passport_obj,
            &status,
            TITLE_GAMESTER,
            2,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        let mut display =
            test_scenario::take_from_sender<title::TitleDisplay>(&scenario);

        let earned_title =
            test_scenario::take_from_sender<title::EarnedTitle>(&scenario);

        assert!(!title::has_equipped_title(&display), 184);

        title::equip_title(
            &mut display,
            &earned_title,
            &passport_obj,
            &status,
            test_scenario::ctx(&mut scenario)
        );

        assert!(title::has_equipped_title(&display), 185);
        assert!(title::get_equipped_title_type(&display) == TITLE_GAMESTER, 186);

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);
        test_scenario::return_to_sender(&scenario, display);
        test_scenario::return_to_sender(&scenario, earned_title);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Black Passport cannot claim new titles.
    /// Expected abort:
    /// conduct_restricted = 101
    /// ---------------------------------------------------------
    #[test, expected_failure(abort_code = 101)]
    fun test_black_passport_cannot_claim_title() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::apply_badge_points(&mut passport_obj, 90);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let mut status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        conduct::down_passport(
            &mut status,
            1,
            999999999999,
            test_scenario::ctx(&mut scenario)
        );

        title::claim_reputation_title(
            &passport_obj,
            &status,
            TITLE_GAMESTER,
            3,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::end(scenario);
    }

        /// ---------------------------------------------------------
    /// Admin can grant a CosmeticUnlock proof.
    /// ---------------------------------------------------------
    #[test]
    fun test_admin_can_grant_cosmetic_unlock() {
        let mut scenario = test_scenario::begin(USER);

        admin::init_for_testing(
            test_scenario::ctx(&mut scenario)
        );

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        admin::grant_cosmetic_unlock(
            &admin_cap,
            USER,
            &passport_obj,
            COSMETIC_PROFILE_FRAME,
            PROFILE_FRAME_CODE,
            1,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let unlock =
            test_scenario::take_from_sender<cosmetics::CosmeticUnlock>(&scenario);

        assert!(cosmetics::get_unlock_owner(&unlock) == USER, 190);
        assert!(cosmetics::get_unlock_type(&unlock) == COSMETIC_PROFILE_FRAME, 191);
        assert!(cosmetics::get_unlock_code(&unlock) == PROFILE_FRAME_CODE, 192);
        assert!(cosmetics::get_unlock_source_code(&unlock) == 1, 193);

        test_scenario::return_to_sender(&scenario, unlock);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// User can create a CosmeticLoadout and equip an unlocked frame.
    /// ---------------------------------------------------------
    #[test]
    fun test_user_can_create_loadout_and_equip_profile_frame() {
        let mut scenario = test_scenario::begin(USER);

        admin::init_for_testing(
            test_scenario::ctx(&mut scenario)
        );

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        admin::grant_cosmetic_unlock(
            &admin_cap,
            USER,
            &passport_obj,
            COSMETIC_PROFILE_FRAME,
            PROFILE_FRAME_CODE,
            2,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        cosmetics::create_loadout(
            &passport_obj,
            &status,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        let mut loadout =
            test_scenario::take_from_sender<cosmetics::CosmeticLoadout>(&scenario);

        let unlock =
            test_scenario::take_from_sender<cosmetics::CosmeticUnlock>(&scenario);

        assert!(cosmetics::get_profile_frame_code(&loadout) == 0, 194);

        cosmetics::equip_cosmetic(
            &mut loadout,
            &unlock,
            &passport_obj,
            &status,
            test_scenario::ctx(&mut scenario)
        );

        assert!(
            cosmetics::get_profile_frame_code(&loadout) == PROFILE_FRAME_CODE,
            195
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);
        test_scenario::return_to_sender(&scenario, loadout);
        test_scenario::return_to_sender(&scenario, unlock);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Black Passport cannot equip cosmetics.
    /// Expected abort:
    /// conduct_restricted = 101
    /// ---------------------------------------------------------
    #[test, expected_failure(abort_code = 101)]
    fun test_black_passport_cannot_equip_cosmetic() {
        let mut scenario = test_scenario::begin(USER);

        admin::init_for_testing(
            test_scenario::ctx(&mut scenario)
        );

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        admin::grant_cosmetic_unlock(
            &admin_cap,
            USER,
            &passport_obj,
            COSMETIC_PROFILE_FRAME,
            PROFILE_FRAME_CODE,
            3,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        cosmetics::create_loadout(
            &passport_obj,
            &status,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let mut status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        let mut loadout =
            test_scenario::take_from_sender<cosmetics::CosmeticLoadout>(&scenario);

        let unlock =
            test_scenario::take_from_sender<cosmetics::CosmeticUnlock>(&scenario);

        conduct::down_passport(
            &mut status,
            1,
            999999999999,
            test_scenario::ctx(&mut scenario)
        );

        cosmetics::equip_cosmetic(
            &mut loadout,
            &unlock,
            &passport_obj,
            &status,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);
        test_scenario::return_to_sender(&scenario, loadout);
        test_scenario::return_to_sender(&scenario, unlock);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// User can open a recovery request for a linked Identity + Passport.
    /// Recovery does not transfer ownership during MVP.
    /// ---------------------------------------------------------
    #[test]
    fun test_user_can_open_recovery_request() {
        let mut scenario = test_scenario::begin(USER);

        identity::init_identity(
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let identity_id = identity::get_id(&identity_obj);

        passport::init_passport(
            identity_id,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, identity_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        recovery::open_recovery_request(
            &identity_obj,
            &passport_obj,
            SPONSORED_USER,
            b"recovery-reference",
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, identity_obj);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let request =
            test_scenario::take_from_sender<recovery::RecoveryRequest>(&scenario);

        assert!(recovery::get_requester(&request) == USER, 200);
        assert!(recovery::get_current_owner(&request) == USER, 201);
        assert!(recovery::get_requested_new_owner(&request) == SPONSORED_USER, 202);
        assert!(recovery::is_open(&request), 203);

        test_scenario::return_to_sender(&scenario, request);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Admin can approve a recovery request.
    /// Approval records decision only. It does not transfer ownership yet.
    /// ---------------------------------------------------------
    #[test]
    fun test_admin_can_approve_recovery_request() {
        let mut scenario = test_scenario::begin(USER);

        admin::init_for_testing(
            test_scenario::ctx(&mut scenario)
        );

        identity::init_identity(
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let identity_id = identity::get_id(&identity_obj);

        passport::init_passport(
            identity_id,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, identity_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        recovery::open_recovery_request(
            &identity_obj,
            &passport_obj,
            SPONSORED_USER,
            b"admin-recovery-reference",
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, identity_obj);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let mut request =
            test_scenario::take_from_sender<recovery::RecoveryRequest>(&scenario);

        admin::resolve_recovery_request(
            &admin_cap,
            &mut request,
            RECOVERY_APPROVED,
            7001,
            test_scenario::ctx(&mut scenario)
        );

        assert!(recovery::is_approved(&request), 204);
        assert!(recovery::get_resolution_code(&request) == 7001, 205);

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, request);

        test_scenario::end(scenario);
    }

        /// ---------------------------------------------------------
    /// Admin can deny a recovery request.
    /// This uses RECOVERY_DENIED so the reserved constant is active.
    /// ---------------------------------------------------------
    #[test]
    fun test_admin_can_deny_recovery_request() {
        let mut scenario = test_scenario::begin(USER);

        admin::init_for_testing(
            test_scenario::ctx(&mut scenario)
        );

        identity::init_identity(
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let identity_id = identity::get_id(&identity_obj);

        passport::init_passport(
            identity_id,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, identity_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let identity_obj =
            test_scenario::take_from_sender<identity::Identity>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        recovery::open_recovery_request(
            &identity_obj,
            &passport_obj,
            SPONSORED_USER,
            b"denied-recovery-reference",
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, identity_obj);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let mut request =
            test_scenario::take_from_sender<recovery::RecoveryRequest>(&scenario);

        admin::resolve_recovery_request(
            &admin_cap,
            &mut request,
            RECOVERY_DENIED,
            7002,
            test_scenario::ctx(&mut scenario)
        );

        assert!(recovery::is_denied(&request), 206);
        assert!(recovery::get_resolution_code(&request) == 7002, 207);

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, request);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Adventurer can create a Channel.
    /// NPC cannot create channels.
    /// ---------------------------------------------------------
    #[test]
    fun test_adventurer_can_create_channel() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::verify_to_adventurer(&mut passport_obj);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        channel::create_channel(
            &passport_obj,
            &status,
            b"main-channel",
            b"Main gamer channel",
            b"metadata://main-channel",
            true,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let channel_obj =
            test_scenario::take_from_sender<channel::Channel>(&scenario);

        assert!(channel::get_owner(&channel_obj) == USER, 210);
        assert!(channel::get_is_public(&channel_obj), 211);
        assert!(!channel::get_is_verified(&channel_obj), 212);

        test_scenario::return_to_sender(&scenario, channel_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// NPC cannot create a Channel.
    /// Expected abort:
    /// insufficient_tier = 31
    /// ---------------------------------------------------------
    #[test, expected_failure(abort_code = 31)]
    fun test_npc_cannot_create_channel() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        channel::create_channel(
            &passport_obj,
            &status,
            b"npc-channel",
            b"NPC should not create this",
            b"metadata://npc-channel",
            true,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Channel owner can update channel metadata.
    /// ---------------------------------------------------------
    #[test]
    fun test_channel_owner_can_update_channel() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::verify_to_adventurer(&mut passport_obj);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        channel::create_channel(
            &passport_obj,
            &status,
            b"update-channel",
            b"Before update",
            b"metadata://before",
            true,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        let mut channel_obj =
            test_scenario::take_from_sender<channel::Channel>(&scenario);

        channel::update_channel(
            &mut channel_obj,
            &passport_obj,
            &status,
            b"updated-channel",
            b"After update",
            b"metadata://after",
            false,
            test_scenario::ctx(&mut scenario)
        );

        assert!(!channel::get_is_public(&channel_obj), 213);

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);
        test_scenario::return_to_sender(&scenario, channel_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// AdminCap can verify a Channel.
    /// ---------------------------------------------------------
    #[test]
    fun test_admin_can_verify_channel() {
        let mut scenario = test_scenario::begin(USER);

        admin::init_for_testing(
            test_scenario::ctx(&mut scenario)
        );

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::verify_to_adventurer(&mut passport_obj);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        channel::create_channel(
            &passport_obj,
            &status,
            b"verified-channel",
            b"Channel to verify",
            b"metadata://verified",
            true,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let admin_cap =
            test_scenario::take_from_sender<admin::AdminCap>(&scenario);

        let mut channel_obj =
            test_scenario::take_from_sender<channel::Channel>(&scenario);

        assert!(!channel::get_is_verified(&channel_obj), 214);

        admin::verify_channel(
            &admin_cap,
            &mut channel_obj,
            test_scenario::ctx(&mut scenario)
        );

        assert!(channel::get_is_verified(&channel_obj), 215);

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_to_sender(&scenario, channel_obj);

        test_scenario::end(scenario);
    }

        /// ---------------------------------------------------------
    /// Channel owner can create an access policy for a real Channel.
    /// This is the public safe path after channel.move exists.
    /// ---------------------------------------------------------
    #[test]
    fun test_channel_owner_can_create_access_policy_for_channel() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::verify_to_adventurer(&mut passport_obj);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        channel::create_channel(
            &passport_obj,
            &status,
            b"policy-channel",
            b"Channel with access policy",
            b"metadata://policy-channel",
            true,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let channel_obj =
            test_scenario::take_from_sender<channel::Channel>(&scenario);

        let channel_id = channel::get_id(&channel_obj);

        channel_access::create_policy_for_channel(
            &channel_obj,
            false,
            ADVENTURER,
            NEWBIE,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, channel_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let channel_obj =
            test_scenario::take_from_sender<channel::Channel>(&scenario);

        let policy =
            test_scenario::take_from_sender<channel_access::ChannelAccessPolicy>(&scenario);

        assert!(channel_access::get_owner(&policy) == USER, 220);
        assert!(channel_access::get_channel_id(&policy) == channel_id, 221);
        assert!(!channel_access::get_allow_npc_chat(&policy), 222);
        assert!(channel_access::get_minimum_tier(&policy) == ADVENTURER, 223);

        test_scenario::return_to_sender(&scenario, channel_obj);
        test_scenario::return_to_sender(&scenario, policy);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Channel owner can update access policy through Channel-aware path.
    /// ---------------------------------------------------------
    #[test]
    fun test_channel_owner_can_update_access_policy_for_channel() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let mut passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        passport::verify_to_adventurer(&mut passport_obj);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        channel::create_channel(
            &passport_obj,
            &status,
            b"update-policy-channel",
            b"Channel with updateable access policy",
            b"metadata://update-policy-channel",
            true,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let channel_obj =
            test_scenario::take_from_sender<channel::Channel>(&scenario);

        channel_access::create_policy_for_channel(
            &channel_obj,
            true,
            NPC,
            NEWBIE,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, channel_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let channel_obj =
            test_scenario::take_from_sender<channel::Channel>(&scenario);

        let mut policy =
            test_scenario::take_from_sender<channel_access::ChannelAccessPolicy>(&scenario);

        assert!(channel_access::get_allow_npc_chat(&policy), 224);

        channel_access::update_policy_for_channel(
            &channel_obj,
            &mut policy,
            false,
            ADVENTURER,
            GAMESTER,
            test_scenario::ctx(&mut scenario)
        );

        assert!(!channel_access::get_allow_npc_chat(&policy), 225);
        assert!(channel_access::get_minimum_tier(&policy) == ADVENTURER, 226);
        assert!(channel_access::get_minimum_reputation(&policy) == GAMESTER, 227);

        test_scenario::return_to_sender(&scenario, channel_obj);
        test_scenario::return_to_sender(&scenario, policy);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// NPC can create a public Profile.
    /// Profiles are basic identity display objects.
    /// ---------------------------------------------------------
    #[test]
    fun test_npc_can_create_public_profile() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        let passport_id = passport::get_id(&passport_obj);

        profile::create_profile(
            &passport_obj,
            &status,
            b"NPC Gamer",
            b"bio://npc-gamer",
            b"avatar://npc-gamer",
            b"metadata://npc-profile",
            true,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let profile_obj =
            test_scenario::take_from_sender<profile::Profile>(&scenario);

        assert!(profile::get_owner(&profile_obj) == USER, 230);
        assert!(profile::get_passport_id(&profile_obj) == passport_id, 231);
        assert!(profile::get_is_public(&profile_obj), 232);

        test_scenario::return_to_sender(&scenario, profile_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Profile owner can update Profile metadata.
    /// ---------------------------------------------------------
    #[test]
    fun test_profile_owner_can_update_profile() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        profile::create_profile(
            &passport_obj,
            &status,
            b"Original Gamer",
            b"bio://original",
            b"avatar://original",
            b"metadata://original",
            true,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        let mut profile_obj =
            test_scenario::take_from_sender<profile::Profile>(&scenario);

        profile::update_profile(
            &mut profile_obj,
            &passport_obj,
            &status,
            b"Updated Gamer",
            b"bio://updated",
            b"avatar://updated",
            b"metadata://updated",
            false,
            test_scenario::ctx(&mut scenario)
        );

        assert!(!profile::get_is_public(&profile_obj), 233);

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);
        test_scenario::return_to_sender(&scenario, profile_obj);

        test_scenario::end(scenario);
    }

    /// ---------------------------------------------------------
    /// Black Passport cannot update Profile.
    /// Expected abort:
    /// conduct_restricted = 101
    /// ---------------------------------------------------------
    #[test, expected_failure(abort_code = 101)]
    fun test_black_passport_cannot_update_profile() {
        let mut scenario = test_scenario::begin(USER);

        passport::init_passport(
            IDENTITY_ID,
            ARCHETYPE_EXPLORER,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        conduct::create_status(
            &passport_obj,
            GREEN,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        profile::create_profile(
            &passport_obj,
            &status,
            b"Restricted Gamer",
            b"bio://restricted",
            b"avatar://restricted",
            b"metadata://restricted",
            true,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);

        test_scenario::next_tx(&mut scenario, USER);

        let passport_obj =
            test_scenario::take_from_sender<passport::Passport>(&scenario);

        let mut status =
            test_scenario::take_from_sender<conduct::ConductStatus>(&scenario);

        let mut profile_obj =
            test_scenario::take_from_sender<profile::Profile>(&scenario);

        conduct::down_passport(
            &mut status,
            1,
            999999999999,
            test_scenario::ctx(&mut scenario)
        );

        profile::update_profile(
            &mut profile_obj,
            &passport_obj,
            &status,
            b"Should Fail",
            b"bio://fail",
            b"avatar://fail",
            b"metadata://fail",
            true,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_to_sender(&scenario, passport_obj);
        test_scenario::return_to_sender(&scenario, status);
        test_scenario::return_to_sender(&scenario, profile_obj);

        test_scenario::end(scenario);
    }
}