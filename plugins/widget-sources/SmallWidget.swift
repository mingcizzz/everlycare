import SwiftUI
import WidgetKit

// MARK: - Small 2×2 widget

struct SmallWidgetEntryView: View {
    let entry: EverlyCareTimelineEntry

    private var data: WidgetEntry { entry.widgetEntry }
    private var isZh: Bool { data.isZh }

    // ── Countdown display ────────────────────────────────────────────────
    private var isCountdown: Bool { entry.countdownSecondsRemaining != nil }

    private var countdownText: String {
        guard let secs = entry.countdownSecondsRemaining else { return "" }
        let m = secs / 60
        let s = secs % 60
        return String(format: "%d:%02d", m, s)
    }

    // ── Normal prediction display ─────────────────────────────────────────
    private var countdownToiletText: String {
        guard let predicted = data.predictedAt else {
            return isZh ? "暂无数据" : "No data"
        }
        let diff = Int(predicted.timeIntervalSinceNow / 60)
        if diff > 0  { return isZh ? "约 \(diff) 分钟后" : "~\(diff) min" }
        if diff == 0 { return isZh ? "现在" : "Now" }
        return isZh ? "超时 \(abs(diff)) 分" : "+\(abs(diff)) min"
    }

    private var windowRangeText: String {
        guard let start = data.windowStart, let end = data.windowEnd else { return "" }
        let fmt = DateFormatter(); fmt.dateFormat = "HH:mm"
        return "\(fmt.string(from: start))–\(fmt.string(from: end))"
    }

    private var urgencyColor: Color { Color(hex: data.urgency.hexColor) }

    // ── Body ──────────────────────────────────────────────────────────────
    var body: some View {
        ZStack {
            Color(hex: "#064E3B")
            VStack(alignment: .leading, spacing: 0) {
                headerRow
                Spacer()
                if isCountdown {
                    countdownView
                } else {
                    predictionView
                }
                Spacer()
                buttonRow
            }
            .padding(12)
        }
        .widgetBackground(Color(hex: "#064E3B"))
    }

    // ── Sub-views ─────────────────────────────────────────────────────────

    private var headerRow: some View {
        HStack(spacing: 4) {
            Text("🚽")
                .font(.system(size: 13))
            Text(isZh ? "如厕助手" : "Toilet")
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(Color(hex: "#A7F3D0"))
            Spacer()
        }
    }

    private var predictionView: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(countdownToiletText)
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundColor(data.urgency == .overdue ? Color(hex: "#EF4444") : .white)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
            if !windowRangeText.isEmpty {
                Text(windowRangeText)
                    .font(.system(size: 10))
                    .foregroundColor(Color(hex: "#6EE7B7"))
            }
        }
    }

    private var countdownView: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(isZh ? "💧 坐够时间" : "💧 Seated")
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(Color(hex: "#A7F3D0"))
            Text(countdownText)
                .font(.system(size: 26, weight: .bold, design: .monospaced))
                .foregroundColor(.white)
        }
    }

    @ViewBuilder
    private var buttonRow: some View {
        if #available(iOS 17.0, *) {
            if isCountdown {
                // Single "Done early" button
                Button(intent: CancelTimerIntent()) {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 11))
                        Text(isZh ? "完成" : "Done")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 5)
                    .foregroundColor(.white)
                    .background(Color(hex: "#059669"))
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            } else {
                // Two buttons: timed + direct
                HStack(spacing: 6) {
                    Button(intent: LogUrinationTimedIntent()) {
                        HStack(spacing: 3) {
                            Image(systemName: "timer")
                                .font(.system(size: 10))
                            Text(isZh ? "计时" : "Timer")
                                .font(.system(size: 11, weight: .bold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 5)
                        .foregroundColor(.white)
                        .background(Color(hex: "#065F46"))
                        .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)

                    Button(intent: LogUrinationDirectIntent()) {
                        HStack(spacing: 3) {
                            Image(systemName: "bolt.fill")
                                .font(.system(size: 10))
                            Text(isZh ? "记录" : "Log")
                                .font(.system(size: 11, weight: .bold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 5)
                        .foregroundColor(.white)
                        .background(urgencyColor.opacity(0.85))
                        .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

// MARK: - WidgetKit background compatibility shim

extension View {
    @ViewBuilder
    func widgetBackground(_ color: Color) -> some View {
        if #available(iOS 17.0, *) {
            self.containerBackground(color, for: .widget)
        } else {
            self.background(color)
        }
    }
}
