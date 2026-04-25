import SwiftUI
import WidgetKit

// MARK: - Timeline Entry (carries countdown state)

struct EverlyCareTimelineEntry: TimelineEntry {
    let date: Date
    let widgetEntry: WidgetEntry
    /// Non-nil while a seated timer is active; value = seconds remaining at `date`.
    let countdownSecondsRemaining: Int?
}

// MARK: - Timeline Provider

struct EverlyCareProvider: TimelineProvider {

    func placeholder(in context: Context) -> EverlyCareTimelineEntry {
        EverlyCareTimelineEntry(date: Date(), widgetEntry: .placeholder, countdownSecondsRemaining: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (EverlyCareTimelineEntry) -> Void) {
        let entry = WidgetDataLoader.load()
        completion(EverlyCareTimelineEntry(date: Date(), widgetEntry: entry, countdownSecondsRemaining: nil))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<EverlyCareTimelineEntry>) -> Void) {
        Task {
            let now          = Date()
            let widgetEntry  = WidgetDataLoader.load()

            // ── Countdown active? ─────────────────────────────────────────
            if let endDate = CountdownStore.endDate() {

                if now >= endDate {
                    // Countdown just expired → auto-log and clear
                    if let creds = WidgetDataLoader.loadCredentials() {
                        let client = SupabaseClient(
                            supabaseUrl: creds.supabaseUrl,
                            accessToken: creds.accessToken
                        )
                        try? await client.insertCareLog(
                            recipientId: creds.recipientId,
                            loggedBy:    creds.loggedBy,
                            logType:     "urination",
                            data: ["method": "planned", "volume": "medium",
                                   "isIncontinence": false, "seatedMinutes": 3]
                        )
                    }
                    CountdownStore.clearCountdown()
                    // Fall through to normal prediction entry below

                } else {
                    // Build per-30-second entries showing the live countdown
                    var entries: [EverlyCareTimelineEntry] = []
                    var t = now
                    while t < endDate {
                        let remaining = max(0, Int(endDate.timeIntervalSince(t)))
                        entries.append(EverlyCareTimelineEntry(
                            date: t,
                            widgetEntry: widgetEntry,
                            countdownSecondsRemaining: remaining
                        ))
                        t = t.addingTimeInterval(30)
                    }
                    // Final entry at exact end (triggers reload → logs)
                    entries.append(EverlyCareTimelineEntry(
                        date: endDate,
                        widgetEntry: widgetEntry,
                        countdownSecondsRemaining: 0
                    ))
                    completion(Timeline(entries: entries, policy: .after(endDate.addingTimeInterval(3))))
                    return
                }
            }

            // ── Normal prediction entry ───────────────────────────────────
            let entry = EverlyCareTimelineEntry(date: now, widgetEntry: widgetEntry, countdownSecondsRemaining: nil)
            let refreshAt = widgetEntry.predictedAt
                .map { max($0, now.addingTimeInterval(60)) }
                ?? now.addingTimeInterval(30 * 60)
            completion(Timeline(entries: [entry], policy: .after(refreshAt)))
        }
    }
}

// MARK: - Small Widget Configuration

struct EverlyCareSmallWidget: Widget {
    let kind: String = "EverlyCareSmall"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: EverlyCareProvider()) { entry in
            SmallWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("EverlyCare — Toilet")
        .description("Shows the next predicted toilet window and quick-log buttons.")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: - Medium Widget Configuration

struct EverlyCaremediumWidget: Widget {
    let kind: String = "EverlyCareMedium"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: EverlyCareProvider()) { entry in
            MediumWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("EverlyCare — Daily Summary")
        .description("Shows toilet prediction, quick-log buttons, and today's care summary.")
        .supportedFamilies([.systemMedium])
    }
}
