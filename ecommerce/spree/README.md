# ADSMedia + Spree Commerce Integration

Send transactional emails from Spree Commerce via ADSMedia.

## Overview

Spree is an open-source e-commerce framework for Ruby on Rails. This integration enables:
- Order confirmation emails
- Shipping notifications
- Customer account emails

## Setup

### 1. Install Gem

Add to your Gemfile:

```ruby
# Gemfile
gem 'adsmedia', '~> 1.0'

# Or use HTTP client directly
gem 'faraday'
```

### 2. Create ADSMedia Mailer

```ruby
# lib/adsmedia/mailer.rb
module ADSMedia
  class Mailer
    API_URL = 'https://api.adsmedia.live/v1/send'.freeze

    def initialize(api_key:, from_name:)
      @api_key = api_key
      @from_name = from_name
    end

    def send_email(to:, to_name:, subject:, html:)
      response = Faraday.post(API_URL) do |req|
        req.headers['Authorization'] = "Bearer #{@api_key}"
        req.headers['Content-Type'] = 'application/json'
        req.body = {
          to: to,
          to_name: to_name,
          subject: subject,
          html: html,
          from_name: @from_name
        }.to_json
      end

      JSON.parse(response.body)
    end
  end
end
```

### 3. Configure Initializer

```ruby
# config/initializers/adsmedia.rb
ADSMedia.configure do |config|
  config.api_key = ENV['ADSMEDIA_API_KEY']
  config.from_name = 'Your Store'
end

ADSMEDIA_MAILER = ADSMedia::Mailer.new(
  api_key: ENV['ADSMEDIA_API_KEY'],
  from_name: 'Your Store'
)
```

### 4. Override Spree Mailer

```ruby
# app/mailers/spree/order_mailer_decorator.rb
module Spree
  module OrderMailerDecorator
    def confirm_email(order, resend = false)
      @order = order
      
      html = render_to_string(
        template: 'spree/order_mailer/confirm_email',
        layout: 'mailer'
      )

      ADSMEDIA_MAILER.send_email(
        to: order.email,
        to_name: order.bill_address&.full_name || '',
        subject: "#{Spree::Store.default.name} Order Confirmation ##{order.number}",
        html: html
      )
    end

    def cancel_email(order, resend = false)
      @order = order
      
      html = render_to_string(
        template: 'spree/order_mailer/cancel_email',
        layout: 'mailer'
      )

      ADSMEDIA_MAILER.send_email(
        to: order.email,
        to_name: order.bill_address&.full_name || '',
        subject: "#{Spree::Store.default.name} Order Cancellation ##{order.number}",
        html: html
      )
    end
  end
end

Spree::OrderMailer.prepend(Spree::OrderMailerDecorator)
```

### 5. Override Shipment Mailer

```ruby
# app/mailers/spree/shipment_mailer_decorator.rb
module Spree
  module ShipmentMailerDecorator
    def shipped_email(shipment, resend = false)
      @shipment = shipment
      @order = shipment.order
      
      html = render_to_string(
        template: 'spree/shipment_mailer/shipped_email',
        layout: 'mailer'
      )

      ADSMEDIA_MAILER.send_email(
        to: @order.email,
        to_name: @order.bill_address&.full_name || '',
        subject: "#{Spree::Store.default.name} Shipment Notification ##{@order.number}",
        html: html
      )
    end
  end
end

Spree::ShipmentMailer.prepend(Spree::ShipmentMailerDecorator)
```

### 6. Email Templates

```erb
<!-- app/views/spree/order_mailer/confirm_email.html.erb -->
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #4F46E5; padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">Order Confirmed! 🎉</h1>
  </div>
  
  <div style="padding: 30px;">
    <p>Hi <%= @order.bill_address&.firstname %>,</p>
    <p>Thank you for your order <strong>#<%= @order.number %></strong>!</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="background: #f5f5f5;">
        <th style="padding: 12px; text-align: left;">Product</th>
        <th style="padding: 12px; text-align: center;">Qty</th>
        <th style="padding: 12px; text-align: right;">Price</th>
      </tr>
      <% @order.line_items.each do |item| %>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;"><%= item.name %></td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;"><%= item.quantity %></td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;"><%= item.display_total %></td>
      </tr>
      <% end %>
    </table>
    
    <p style="font-size: 18px; text-align: right;">
      <strong>Total: <%= @order.display_total %></strong>
    </p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    
    <h3>Shipping Address</h3>
    <p>
      <%= @order.ship_address&.full_name %><br>
      <%= @order.ship_address&.address1 %><br>
      <% if @order.ship_address&.address2.present? %><%= @order.ship_address.address2 %><br><% end %>
      <%= @order.ship_address&.city %>, <%= @order.ship_address&.zipcode %><br>
      <%= @order.ship_address&.country&.name %>
    </p>
  </div>
</body>
</html>
```

## Spree Extension

Create a full Spree extension:

```ruby
# spree_adsmedia.gemspec
Gem::Specification.new do |s|
  s.name = 'spree_adsmedia'
  s.version = '1.0.0'
  s.summary = 'ADSMedia email integration for Spree Commerce'
  s.required_ruby_version = '>= 2.7'

  s.author = 'ADSMedia'
  s.email = 'support@adsmedia.ai'
  s.homepage = 'https://github.com/ADSMedia-ai/spree_adsmedia'

  s.files = Dir['{app,config,lib}/**/*']
  s.require_path = 'lib'

  s.add_dependency 'spree_core', '>= 4.0'
  s.add_dependency 'faraday', '~> 2.0'
end
```

## Environment Variables

```bash
# .env
ADSMEDIA_API_KEY=your_api_key_here
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Spree Commerce](https://spreecommerce.org)
- [Spree Docs](https://dev-docs.spreecommerce.org)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

