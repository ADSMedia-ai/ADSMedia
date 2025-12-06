=== ADSMedia Email API ===
Contributors: adsmedia
Tags: email, smtp, transactional, marketing, api
Requires at least: 5.0
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Send transactional and marketing emails via ADSMedia API. Replaces wp_mail() with high-deliverability email sending.

== Description ==

ADSMedia Email API plugin allows you to send all WordPress emails through the ADSMedia email delivery service. 

**Features:**

* Replace wp_mail() with ADSMedia API
* High deliverability rates
* Send test emails from admin panel
* Connection status check
* Email logging support
* WooCommerce compatible
* Developer-friendly helper functions

**For Developers:**

```php
// Send single email
adsmedia_send_email('user@example.com', 'Subject', 'Message', false);

// Send HTML email
adsmedia_send_email('user@example.com', 'Subject', '<h1>Hello</h1>', true);

// Send batch emails (up to 1000 recipients)
adsmedia_send_batch(
    [
        ['email' => 'user1@example.com', 'name' => 'User 1'],
        ['email' => 'user2@example.com', 'name' => 'User 2']
    ],
    'Hello %%First Name%%!',
    '<h1>Hi %%First Name%%!</h1>',
    'Plain text version',
    'Preheader text'
);
```

== Installation ==

1. Upload the `adsmedia-email` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to Settings > ADSMedia Email
4. Enter your API key from [adsmedia.ai](https://adsmedia.ai)
5. Enable "Replace wp_mail()" to send all WordPress emails through ADSMedia

== Frequently Asked Questions ==

= Where do I get an API key? =

Sign up at [adsmedia.ai](https://adsmedia.ai) and go to Settings > API Keys.

= Will this work with WooCommerce? =

Yes! When "Replace wp_mail()" is enabled, all WooCommerce emails will be sent through ADSMedia.

= Can I send HTML emails? =

Yes, the plugin automatically detects HTML content and sends it properly.

== Changelog ==

= 1.0.0 =
* Initial release
* wp_mail() replacement
* Admin settings page
* Test email functionality
* Connection check
* Batch sending support

== Upgrade Notice ==

= 1.0.0 =
Initial release

