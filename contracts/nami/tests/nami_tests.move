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

    /// Test addresses
    const USER: address = @0x1;
    const IDENTITY_ID: address = @0x100;
    const CHANNEL_ID: address = @0x200;

    /// Archetypes
    const ARCHETYPE_EXPLORER: u8 = 1;

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
}