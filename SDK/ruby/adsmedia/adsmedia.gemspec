Gem::Specification.new do |spec|
  spec.name          = "adsmedia"
  spec.version       = "1.0.0"
  spec.authors       = ["ADSMedia"]
  spec.email         = ["dev@adsmedia.ai"]

  spec.summary       = "Official Ruby SDK for ADSMedia Email API"
  spec.description   = "Send transactional and marketing emails via ADSMedia API"
  spec.homepage      = "https://github.com/ADSMedia-ai/ADSMedia"
  spec.license       = "MIT"

  spec.required_ruby_version = ">= 2.7.0"

  spec.files         = Dir["lib/**/*.rb"]
  spec.require_paths = ["lib"]

  spec.add_dependency "faraday", "~> 2.0"
  spec.add_dependency "json", "~> 2.0"
end

