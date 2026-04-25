import Foundation

/// Manages the 3-minute seated toilet timer state in shared App Groups storage.
struct CountdownStore {
    static let suiteId          = "group.com.everlycare.app"
    static let startedAtKey     = "everlycare.widget.countdown_started_at"
    static let durationSeconds: TimeInterval = 3 * 60  // 3 minutes

    // MARK: - Write

    static func startCountdown() {
        guard let defaults = UserDefaults(suiteName: suiteId) else { return }
        defaults.set(Date().timeIntervalSince1970, forKey: startedAtKey)
        defaults.synchronize()
    }

    static func clearCountdown() {
        guard let defaults = UserDefaults(suiteName: suiteId) else { return }
        defaults.removeObject(forKey: startedAtKey)
        defaults.synchronize()
    }

    // MARK: - Read

    /// Returns the time the countdown will end, or nil if no countdown is active.
    static func endDate() -> Date? {
        guard
            let defaults = UserDefaults(suiteName: suiteId),
            defaults.object(forKey: startedAtKey) != nil
        else { return nil }

        let startedAt = defaults.double(forKey: startedAtKey)
        guard startedAt > 0 else { return nil }
        return Date(timeIntervalSince1970: startedAt + durationSeconds)
    }

    /// Whole seconds remaining in the active countdown, or nil if no countdown.
    static func secondsRemaining() -> Int? {
        guard let end = endDate() else { return nil }
        let remaining = Int(end.timeIntervalSinceNow)
        return remaining >= 0 ? remaining : 0
    }

    /// True if a countdown is running and has not yet expired.
    static var isActive: Bool {
        guard let end = endDate() else { return false }
        return Date() < end
    }

    /// True if a countdown was started but has already expired (needs to be logged + cleared).
    static var isExpired: Bool {
        guard let end = endDate() else { return false }
        return Date() >= end
    }
}
