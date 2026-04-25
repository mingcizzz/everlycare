Pod::Spec.new do |s|
  s.name           = 'WidgetSync'
  s.version        = '1.0.0'
  s.summary        = 'Expo Module to sync data to iOS WidgetKit widgets'
  s.description    = 'Writes JSON payload to a shared App Group UserDefaults and reloads all WidgetKit timelines.'
  s.author         = 'EverlyCare'
  s.homepage       = 'https://github.com/everlycare'
  s.platforms      = { :ios => '16.0' }
  s.source         = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.{swift,h,m}'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
