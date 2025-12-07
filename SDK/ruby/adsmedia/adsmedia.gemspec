Gem::Specification.new do |spec|
  spec.name          = "adsmedia"
  spec.version       = "1.0.2"
  spec.authors       = ["ADSMedia"]
  spec.email         = ["dev@adsmedia.ai"]

  spec.summary       = "Official Ruby SDK for ADSMedia Email API"
  spec.description   = "Send transactional and marketing emails via ADSMedia API"
  spec.homepage      = "https://www.adsmedia.ai"
  spec.license       = "MIT"
  
  spec.metadata = {
    "homepage_uri"      => "https://www.adsmedia.ai",
    "source_code_uri"   => "https://github.com/ADSMedia-ai/ADSMedia/tree/main/SDK/ruby/adsmedia",
    "documentation_uri" => "https://www.adsmedia.ai/api-docs",
    "changelog_uri"     => "https://github.com/ADSMedia-ai/ADSMedia/blob/main/SDK/ruby/adsmedia/CHANGELOG.md"
  }

  spec.required_ruby_version = ">= 2.7.0"

  spec.files         = Dir["lib/**/*.rb"]
  spec.require_paths = ["lib"]

  spec.add_dependency "faraday", "~> 2.0"
  spec.add_dependency "json", "~> 2.0"
end

