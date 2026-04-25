import Foundation

// MARK: - Raw JSON payload written by React Native via WidgetSyncModule

struct WidgetPayload: Codable {
    struct Prediction: Codable {
        let predictedAt: String       // ISO-8601
        let windowStartAt: String
        let windowEndAt: String
        let urgencyLevel: String      // low | approaching | high | overdue
        let confidenceScore: Double
    }

    struct DailySummary: Codable {
        let urinationCount: Int
        let bowelCount: Int
        let accidentCount: Int
        let medicationDone: Int
        let medicationTotal: Int
        let lastUpdated: String       // ISO-8601
    }

    let prediction: Prediction?
    let dailySummary: DailySummary?
    let recipientName: String?
    let language: String?             // "zh-CN" | "en"

    // --- Credentials for direct Supabase writes ---
    let supabaseUrl: String?
    let accessToken: String?
    let recipientId: String?
    let loggedBy: String?             // caregiver user UUID
}

// MARK: - Parsed entry used by both widget views

struct WidgetEntry {
    // --- prediction ---
    let predictedAt: Date?
    let windowStart: Date?
    let windowEnd: Date?
    let urgency: UrgencyLevel
    let confidence: Double            // 0-1

    // --- daily summary ---
    let urinationCount: Int
    let bowelCount: Int
    let accidentCount: Int
    let medicationDone: Int
    let medicationTotal: Int

    let recipientName: String
    let isZh: Bool

    static let placeholder = WidgetEntry(
        predictedAt: Date().addingTimeInterval(40 * 60),
        windowStart: Date().addingTimeInterval(30 * 60),
        windowEnd: Date().addingTimeInterval(55 * 60),
        urgency: .low,
        confidence: 0.7,
        urinationCount: 3,
        bowelCount: 1,
        accidentCount: 0,
        medicationDone: 2,
        medicationTotal: 3,
        recipientName: "Grandpa",
        isZh: false
    )
}

// MARK: - Credentials used by App Intents

struct WidgetCredentials {
    let supabaseUrl: String
    let accessToken: String
    let recipientId: String
    let loggedBy: String
}

enum UrgencyLevel: String {
    case low, approaching, high, overdue

    var hexColor: String {
        switch self {
        case .low:         return "#5EEAD4"
        case .approaching: return "#0D9488"
        case .high:        return "#D97706"
        case .overdue:     return "#EF4444"
        }
    }
}

// MARK: - Loader

struct WidgetDataLoader {
    static let suiteId = "group.com.everlycare.app"
    static let key     = "everly_widget_data"

    static func load() -> WidgetEntry {
        guard
            let defaults = UserDefaults(suiteName: suiteId),
            let json = defaults.string(forKey: key),
            let data = json.data(using: .utf8),
            let payload = try? JSONDecoder().decode(WidgetPayload.self, from: data)
        else {
            return .placeholder
        }
        return parseEntry(from: payload)
    }

    static func loadCredentials() -> WidgetCredentials? {
        guard
            let defaults  = UserDefaults(suiteName: suiteId),
            let json      = defaults.string(forKey: key),
            let data      = json.data(using: .utf8),
            let payload   = try? JSONDecoder().decode(WidgetPayload.self, from: data),
            let url       = payload.supabaseUrl,   !url.isEmpty,
            let token     = payload.accessToken,   !token.isEmpty,
            let recipient = payload.recipientId,   !recipient.isEmpty,
            let logger    = payload.loggedBy,      !logger.isEmpty
        else { return nil }

        return WidgetCredentials(
            supabaseUrl: url,
            accessToken: token,
            recipientId: recipient,
            loggedBy:    logger
        )
    }

    // MARK: Private

    private static func parseEntry(from payload: WidgetPayload) -> WidgetEntry {
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let isoBasic = ISO8601DateFormatter()

        func parse(_ s: String?) -> Date? {
            guard let s = s else { return nil }
            return iso.date(from: s) ?? isoBasic.date(from: s)
        }

        let urgency = UrgencyLevel(rawValue: payload.prediction?.urgencyLevel ?? "low") ?? .low
        let isZh    = payload.language == "zh-CN"

        return WidgetEntry(
            predictedAt:     parse(payload.prediction?.predictedAt),
            windowStart:     parse(payload.prediction?.windowStartAt),
            windowEnd:       parse(payload.prediction?.windowEndAt),
            urgency:         urgency,
            confidence:      payload.prediction?.confidenceScore ?? 0,
            urinationCount:  payload.dailySummary?.urinationCount  ?? 0,
            bowelCount:      payload.dailySummary?.bowelCount       ?? 0,
            accidentCount:   payload.dailySummary?.accidentCount    ?? 0,
            medicationDone:  payload.dailySummary?.medicationDone   ?? 0,
            medicationTotal: payload.dailySummary?.medicationTotal  ?? 0,
            recipientName:   payload.recipientName ?? "Care",
            isZh:            isZh
        )
    }
}
