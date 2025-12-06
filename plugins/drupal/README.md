# ADSMedia Drupal Module

Send emails via ADSMedia API from Drupal CMS.

## Overview

This module replaces Drupal's mail system with ADSMedia API for better deliverability and tracking.

## Installation

### Method 1: Manual Installation

1. Download the module files
2. Place in `modules/custom/adsmedia/`
3. Enable in Drupal admin

### Method 2: Composer (when published)

```bash
composer require adsmedia/drupal-adsmedia
drush en adsmedia
```

## Module Structure

```
adsmedia/
├── adsmedia.info.yml
├── adsmedia.module
├── adsmedia.install
├── adsmedia.services.yml
├── src/
│   ├── ADSMediaMailSystem.php
│   └── Form/
│       └── ADSMediaSettingsForm.php
├── config/
│   └── install/
│       └── adsmedia.settings.yml
└── README.md
```

## Files

### adsmedia.info.yml

```yaml
name: 'ADSMedia Email'
type: module
description: 'Send emails via ADSMedia API'
package: Mail
core_version_requirement: ^9 || ^10
configure: adsmedia.settings

dependencies:
  - drupal:system (>=9.0)
```

### adsmedia.services.yml

```yaml
services:
  plugin.manager.mail.adsmedia:
    class: Drupal\adsmedia\ADSMediaMailSystem
    arguments: ['@config.factory', '@http_client', '@logger.factory']
```

### adsmedia.module

```php
<?php

/**
 * @file
 * ADSMedia Email module.
 */

use Drupal\Core\Routing\RouteMatchInterface;

/**
 * Implements hook_help().
 */
function adsmedia_help($route_name, RouteMatchInterface $route_match) {
  switch ($route_name) {
    case 'help.page.adsmedia':
      return '<p>' . t('Send emails via ADSMedia API for better deliverability.') . '</p>';
  }
}

/**
 * Implements hook_mail_alter().
 */
function adsmedia_mail_alter(&$message) {
  $config = \Drupal::config('adsmedia.settings');
  
  if ($config->get('enabled')) {
    $message['send'] = TRUE;
  }
}
```

### src/ADSMediaMailSystem.php

```php
<?php

namespace Drupal\adsmedia;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Mail\MailInterface;
use GuzzleHttp\ClientInterface;

/**
 * ADSMedia mail system implementation.
 */
class ADSMediaMailSystem implements MailInterface {

  protected $configFactory;
  protected $httpClient;
  protected $logger;
  protected $apiKey;
  protected $baseUrl = 'https://api.adsmedia.live/v1';

  public function __construct(
    ConfigFactoryInterface $config_factory,
    ClientInterface $http_client,
    LoggerChannelFactoryInterface $logger_factory
  ) {
    $this->configFactory = $config_factory;
    $this->httpClient = $http_client;
    $this->logger = $logger_factory->get('adsmedia');
    $this->apiKey = $config_factory->get('adsmedia.settings')->get('api_key');
  }

  /**
   * {@inheritdoc}
   */
  public function format(array $message) {
    $message['body'] = implode("\n\n", $message['body']);
    return $message;
  }

  /**
   * {@inheritdoc}
   */
  public function mail(array $message) {
    if (empty($this->apiKey)) {
      $this->logger->error('ADSMedia API key not configured');
      return FALSE;
    }

    $config = $this->configFactory->get('adsmedia.settings');
    
    // Prepare email data
    $data = [
      'to' => $message['to'],
      'subject' => $message['subject'],
      'html' => $this->formatHtml($message['body']),
      'from_name' => $config->get('from_name') ?: 'Drupal',
    ];

    if (!empty($message['headers']['Reply-To'])) {
      $data['reply_to'] = $message['headers']['Reply-To'];
    }

    try {
      $response = $this->httpClient->post($this->baseUrl . '/send', [
        'headers' => [
          'Authorization' => 'Bearer ' . $this->apiKey,
          'Content-Type' => 'application/json',
        ],
        'json' => $data,
      ]);

      $result = json_decode($response->getBody(), TRUE);

      if (!empty($result['success'])) {
        $this->logger->info('Email sent to @to. Message ID: @id', [
          '@to' => $message['to'],
          '@id' => $result['data']['message_id'] ?? 'unknown',
        ]);
        return TRUE;
      }

      $this->logger->error('ADSMedia API error: @message', [
        '@message' => $result['error']['message'] ?? 'Unknown error',
      ]);
      return FALSE;

    } catch (\Exception $e) {
      $this->logger->error('ADSMedia send failed: @message', [
        '@message' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

  /**
   * Format body as HTML.
   */
  protected function formatHtml($body) {
    if (strip_tags($body) === $body) {
      // Plain text - wrap in HTML
      return '<html><body><p>' . nl2br(htmlspecialchars($body)) . '</p></body></html>';
    }
    return $body;
  }
}
```

### src/Form/ADSMediaSettingsForm.php

```php
<?php

namespace Drupal\adsmedia\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * ADSMedia settings form.
 */
class ADSMediaSettingsForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return ['adsmedia.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'adsmedia_settings_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('adsmedia.settings');

    $form['api_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('API Key'),
      '#default_value' => $config->get('api_key'),
      '#required' => TRUE,
      '#description' => $this->t('Your ADSMedia API key'),
    ];

    $form['enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable ADSMedia'),
      '#default_value' => $config->get('enabled'),
      '#description' => $this->t('Enable ADSMedia as the mail system'),
    ];

    $form['from_name'] = [
      '#type' => 'textfield',
      '#title' => $this->t('From Name'),
      '#default_value' => $config->get('from_name'),
      '#description' => $this->t('Default sender name'),
    ];

    $form['test'] = [
      '#type' => 'details',
      '#title' => $this->t('Test Email'),
      '#open' => FALSE,
    ];

    $form['test']['test_email'] = [
      '#type' => 'email',
      '#title' => $this->t('Test Email Address'),
    ];

    $form['test']['send_test'] = [
      '#type' => 'submit',
      '#value' => $this->t('Send Test Email'),
      '#submit' => ['::sendTestEmail'],
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $this->config('adsmedia.settings')
      ->set('api_key', $form_state->getValue('api_key'))
      ->set('enabled', $form_state->getValue('enabled'))
      ->set('from_name', $form_state->getValue('from_name'))
      ->save();

    parent::submitForm($form, $form_state);
  }

  /**
   * Send test email.
   */
  public function sendTestEmail(array &$form, FormStateInterface $form_state) {
    $to = $form_state->getValue('test_email');
    
    if (empty($to)) {
      $this->messenger()->addError($this->t('Please enter a test email address'));
      return;
    }

    $mailManager = \Drupal::service('plugin.manager.mail');
    $result = $mailManager->mail('adsmedia', 'test', $to, 'en', [
      'subject' => 'ADSMedia Test Email',
      'body' => ['This is a test email from your Drupal site using ADSMedia.'],
    ]);

    if ($result['result']) {
      $this->messenger()->addMessage($this->t('Test email sent to @email', ['@email' => $to]));
    } else {
      $this->messenger()->addError($this->t('Failed to send test email'));
    }
  }
}
```

### config/install/adsmedia.settings.yml

```yaml
api_key: ''
enabled: false
from_name: 'Drupal'
```

## Configuration

1. Go to **Configuration** → **System** → **ADSMedia Email**
2. Enter your API key
3. Enable ADSMedia
4. Set default from name
5. Send test email

### Set as Default Mail System

In `settings.php`:

```php
$config['system.mail']['interface']['default'] = 'adsmedia';
```

Or via Drush:

```bash
drush config-set system.mail interface.default adsmedia
```

## Usage

Once configured, all Drupal emails will be sent via ADSMedia:

- User registration emails
- Password reset emails
- Contact form submissions
- Commerce order emails
- Custom module emails

## Hooks

### Alter email before sending

```php
/**
 * Implements hook_mail_alter().
 */
function mymodule_mail_alter(&$message) {
  // Add custom header
  $message['headers']['X-Custom'] = 'value';
  
  // Modify content
  $message['body'][] = 'Additional content';
}
```

## Logging

Emails are logged to Drupal's watchdog:

```bash
drush watchdog:show --type=adsmedia
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Drupal](https://www.drupal.org)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

