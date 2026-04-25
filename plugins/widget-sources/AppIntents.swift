import AppIntents
import WidgetKit

// MARK: - 1. Start seated toilet timer (3-minute countdown)

@available(iOS 17.0, *)
struct LogUrinationTimedIntent: AppIntent {
    static var title: LocalizedStringResource = "Start Toilet Timer"
    static var description = IntentDescription(
        "Starts a 3-minute seated timer. When it ends the urination is logged automatically."
    )

    func perform() async throws -> some IntentResult {
        CountdownStore.startCountdown()
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

// MARK: - 2. Log urination immediately (no timer)

@available(iOS 17.0, *)
struct LogUrinationDirectIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Urination"
    static var description = IntentDescription("Immediately logs a urination event.")

    func perform() async throws -> some IntentResult {
        CountdownStore.clearCountdown()
        guard let creds = WidgetDataLoader.loadCredentials() else {
            WidgetCenter.shared.reloadAllTimelines()
            return .result()
        }
        let client = SupabaseClient(supabaseUrl: creds.supabaseUrl, accessToken: creds.accessToken)
        try? await client.insertCareLog(
            recipientId: creds.recipientId,
            loggedBy:    creds.loggedBy,
            logType:     "urination",
            data:        ["method": "planned", "volume": "medium", "isIncontinence": false]
        )
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

// MARK: - 3. Cancel active countdown (user finishes early)

@available(iOS 17.0, *)
struct CancelTimerIntent: AppIntent {
    static var title: LocalizedStringResource = "Done — Log Now"
    static var description = IntentDescription("Stops the timer and logs the urination immediately.")

    func perform() async throws -> some IntentResult {
        CountdownStore.clearCountdown()
        guard let creds = WidgetDataLoader.loadCredentials() else {
            WidgetCenter.shared.reloadAllTimelines()
            return .result()
        }
        let client = SupabaseClient(supabaseUrl: creds.supabaseUrl, accessToken: creds.accessToken)
        try? await client.insertCareLog(
            recipientId: creds.recipientId,
            loggedBy:    creds.loggedBy,
            logType:     "urination",
            data:        ["method": "planned", "volume": "medium", "isIncontinence": false]
        )
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

// MARK: - 4. Log bowel movement

@available(iOS 17.0, *)
struct LogBowelIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Bowel Movement"
    static var description = IntentDescription("Logs a normal bowel movement.")

    func perform() async throws -> some IntentResult {
        guard let creds = WidgetDataLoader.loadCredentials() else {
            return .result()
        }
        let client = SupabaseClient(supabaseUrl: creds.supabaseUrl, accessToken: creds.accessToken)
        try? await client.insertCareLog(
            recipientId: creds.recipientId,
            loggedBy:    creds.loggedBy,
            logType:     "bowel",
            data:        ["type": "normal", "isAccident": false, "location": "toilet"]
        )
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

// MARK: - 5. Log fluid intake (parameterised by ml amount)

@available(iOS 17.0, *)
struct LogFluidIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Fluid Intake"
    static var description = IntentDescription("Logs a fluid intake with a specified amount in ml.")

    @Parameter(title: "Amount (ml)")
    var amountMl: Int

    init() { amountMl = 200 }
    init(amountMl: Int) { self.amountMl = amountMl }

    func perform() async throws -> some IntentResult {
        guard let creds = WidgetDataLoader.loadCredentials() else {
            return .result()
        }
        let client = SupabaseClient(supabaseUrl: creds.supabaseUrl, accessToken: creds.accessToken)
        try? await client.insertCareLog(
            recipientId: creds.recipientId,
            loggedBy:    creds.loggedBy,
            logType:     "meal",
            data:        ["mealType": "fluid", "fluidAmountMl": amountMl, "appetite": "good"]
        )
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}
