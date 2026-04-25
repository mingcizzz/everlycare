import ExpoModulesCore
import WidgetKit

public class WidgetSyncModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WidgetSync")

    AsyncFunction("syncWidgetData") { (jsonPayload: String) in
      let suiteId = "group.com.everlycare.app"
      guard let defaults = UserDefaults(suiteName: suiteId) else { return }
      defaults.set(jsonPayload, forKey: "everly_widget_data")
      defaults.synchronize()
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}
