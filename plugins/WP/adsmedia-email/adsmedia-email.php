<?php
/**
 * Plugin Name: ADSMedia Email API
 * Plugin URI: https://adsmedia.ai
 * Description: Send transactional and marketing emails via ADSMedia API. Replaces wp_mail() with ADSMedia.
 * Version: 1.0.0
 * Author: ADSMedia
 * Author URI: https://adsmedia.ai
 * License: GPL v2 or later
 * Text Domain: adsmedia-email
 */

if (!defined('ABSPATH')) {
    exit;
}

define('ADSMEDIA_VERSION', '1.0.0');
define('ADSMEDIA_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ADSMEDIA_PLUGIN_URL', plugin_dir_url(__FILE__));
define('ADSMEDIA_API_URL', 'https://api.adsmedia.live/v1');

class ADSMediaEmail {
    
    private static $instance = null;
    private $apiKey = '';
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->apiKey = get_option('adsmedia_api_key', '');
        
        // Admin menu
        add_action('admin_menu', [$this, 'addAdminMenu']);
        add_action('admin_init', [$this, 'registerSettings']);
        
        // Replace wp_mail if enabled
        if (get_option('adsmedia_replace_wp_mail', false) && !empty($this->apiKey)) {
            add_filter('pre_wp_mail', [$this, 'interceptWpMail'], 10, 2);
        }
        
        // Admin notices
        add_action('admin_notices', [$this, 'adminNotices']);
        
        // AJAX handlers
        add_action('wp_ajax_adsmedia_test_email', [$this, 'ajaxTestEmail']);
        add_action('wp_ajax_adsmedia_check_connection', [$this, 'ajaxCheckConnection']);
    }
    
    /**
     * Add admin menu
     */
    public function addAdminMenu() {
        add_options_page(
            'ADSMedia Email',
            'ADSMedia Email',
            'manage_options',
            'adsmedia-email',
            [$this, 'renderSettingsPage']
        );
    }
    
    /**
     * Register settings
     */
    public function registerSettings() {
        register_setting('adsmedia_settings', 'adsmedia_api_key', [
            'sanitize_callback' => 'sanitize_text_field'
        ]);
        register_setting('adsmedia_settings', 'adsmedia_from_name', [
            'sanitize_callback' => 'sanitize_text_field'
        ]);
        register_setting('adsmedia_settings', 'adsmedia_replace_wp_mail', [
            'sanitize_callback' => 'absint'
        ]);
        register_setting('adsmedia_settings', 'adsmedia_log_emails', [
            'sanitize_callback' => 'absint'
        ]);
    }
    
    /**
     * Admin notices
     */
    public function adminNotices() {
        if (empty($this->apiKey) && current_user_can('manage_options')) {
            $settingsUrl = admin_url('options-general.php?page=adsmedia-email');
            echo '<div class="notice notice-warning is-dismissible">';
            echo '<p><strong>ADSMedia Email:</strong> ';
            echo sprintf(
                __('Please <a href="%s">configure your API key</a> to start sending emails.', 'adsmedia-email'),
                esc_url($settingsUrl)
            );
            echo '</p></div>';
        }
    }
    
    /**
     * Render settings page
     */
    public function renderSettingsPage() {
        if (!current_user_can('manage_options')) {
            return;
        }
        
        // Handle form submission
        if (isset($_POST['adsmedia_save_settings']) && check_admin_referer('adsmedia_settings_nonce')) {
            update_option('adsmedia_api_key', sanitize_text_field($_POST['adsmedia_api_key'] ?? ''));
            update_option('adsmedia_from_name', sanitize_text_field($_POST['adsmedia_from_name'] ?? ''));
            update_option('adsmedia_replace_wp_mail', isset($_POST['adsmedia_replace_wp_mail']) ? 1 : 0);
            update_option('adsmedia_log_emails', isset($_POST['adsmedia_log_emails']) ? 1 : 0);
            
            $this->apiKey = get_option('adsmedia_api_key', '');
            
            echo '<div class="notice notice-success is-dismissible"><p>Settings saved!</p></div>';
        }
        
        $apiKey = get_option('adsmedia_api_key', '');
        $fromName = get_option('adsmedia_from_name', get_bloginfo('name'));
        $replaceWpMail = get_option('adsmedia_replace_wp_mail', false);
        $logEmails = get_option('adsmedia_log_emails', false);
        
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <div style="display: flex; gap: 20px; margin-top: 20px;">
                <!-- Settings Form -->
                <div style="flex: 1; max-width: 600px;">
                    <form method="post" action="">
                        <?php wp_nonce_field('adsmedia_settings_nonce'); ?>
                        
                        <table class="form-table">
                            <tr>
                                <th scope="row">
                                    <label for="adsmedia_api_key">API Key</label>
                                </th>
                                <td>
                                    <input type="password" 
                                           id="adsmedia_api_key" 
                                           name="adsmedia_api_key" 
                                           value="<?php echo esc_attr($apiKey); ?>" 
                                           class="regular-text"
                                           autocomplete="off">
                                    <p class="description">
                                        Get your API key from <a href="https://adsmedia.ai" target="_blank">adsmedia.ai</a>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <label for="adsmedia_from_name">From Name</label>
                                </th>
                                <td>
                                    <input type="text" 
                                           id="adsmedia_from_name" 
                                           name="adsmedia_from_name" 
                                           value="<?php echo esc_attr($fromName); ?>" 
                                           class="regular-text">
                                    <p class="description">
                                        Sender name for outgoing emails
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Replace wp_mail()</th>
                                <td>
                                    <label>
                                        <input type="checkbox" 
                                               name="adsmedia_replace_wp_mail" 
                                               value="1" 
                                               <?php checked($replaceWpMail, 1); ?>>
                                        Send all WordPress emails through ADSMedia
                                    </label>
                                    <p class="description">
                                        When enabled, all emails sent via wp_mail() will use ADSMedia API
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Log Emails</th>
                                <td>
                                    <label>
                                        <input type="checkbox" 
                                               name="adsmedia_log_emails" 
                                               value="1" 
                                               <?php checked($logEmails, 1); ?>>
                                        Log all sent emails
                                    </label>
                                    <p class="description">
                                        Save email logs to debug.log (requires WP_DEBUG_LOG)
                                    </p>
                                </td>
                            </tr>
                        </table>
                        
                        <p class="submit">
                            <input type="submit" 
                                   name="adsmedia_save_settings" 
                                   class="button button-primary" 
                                   value="Save Settings">
                            <button type="button" 
                                    id="adsmedia-check-connection" 
                                    class="button"
                                    style="margin-left: 10px;">
                                Check Connection
                            </button>
                        </p>
                    </form>
                    
                    <div id="connection-status" style="margin-top: 10px;"></div>
                </div>
                
                <!-- Test Email Box -->
                <div style="flex: 1; max-width: 400px;">
                    <div class="card" style="max-width: 100%; padding: 20px;">
                        <h2 style="margin-top: 0;">Send Test Email</h2>
                        
                        <p>
                            <label for="test_email_to"><strong>To:</strong></label><br>
                            <input type="email" 
                                   id="test_email_to" 
                                   value="<?php echo esc_attr(get_option('admin_email')); ?>" 
                                   class="regular-text" 
                                   style="width: 100%;">
                        </p>
                        
                        <p>
                            <label for="test_email_subject"><strong>Subject:</strong></label><br>
                            <input type="text" 
                                   id="test_email_subject" 
                                   value="Test email from ADSMedia Plugin" 
                                   class="regular-text" 
                                   style="width: 100%;">
                        </p>
                        
                        <p>
                            <label for="test_email_message"><strong>Message:</strong></label><br>
                            <textarea id="test_email_message" 
                                      rows="4" 
                                      style="width: 100%;">This is a test email sent via ADSMedia Email API plugin for WordPress.</textarea>
                        </p>
                        
                        <p>
                            <button type="button" 
                                    id="adsmedia-send-test" 
                                    class="button button-primary"
                                    <?php echo empty($apiKey) ? 'disabled' : ''; ?>>
                                Send Test Email
                            </button>
                        </p>
                        
                        <div id="test-email-result"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            // Check connection
            $('#adsmedia-check-connection').on('click', function() {
                var $btn = $(this);
                var $status = $('#connection-status');
                
                $btn.prop('disabled', true).text('Checking...');
                $status.html('<span style="color: #666;">Connecting to ADSMedia API...</span>');
                
                $.post(ajaxurl, {
                    action: 'adsmedia_check_connection',
                    nonce: '<?php echo wp_create_nonce('adsmedia_ajax'); ?>'
                }, function(response) {
                    $btn.prop('disabled', false).text('Check Connection');
                    
                    if (response.success) {
                        $status.html('<span style="color: green;">✓ ' + response.data.message + '</span>');
                    } else {
                        $status.html('<span style="color: red;">✗ ' + response.data.message + '</span>');
                    }
                }).fail(function() {
                    $btn.prop('disabled', false).text('Check Connection');
                    $status.html('<span style="color: red;">✗ Connection failed</span>');
                });
            });
            
            // Send test email
            $('#adsmedia-send-test').on('click', function() {
                var $btn = $(this);
                var $result = $('#test-email-result');
                
                var to = $('#test_email_to').val();
                var subject = $('#test_email_subject').val();
                var message = $('#test_email_message').val();
                
                if (!to) {
                    $result.html('<span style="color: red;">Please enter recipient email</span>');
                    return;
                }
                
                $btn.prop('disabled', true).text('Sending...');
                $result.html('<span style="color: #666;">Sending email...</span>');
                
                $.post(ajaxurl, {
                    action: 'adsmedia_test_email',
                    nonce: '<?php echo wp_create_nonce('adsmedia_ajax'); ?>',
                    to: to,
                    subject: subject,
                    message: message
                }, function(response) {
                    $btn.prop('disabled', false).text('Send Test Email');
                    
                    if (response.success) {
                        $result.html('<span style="color: green;">✓ ' + response.data.message + '</span>');
                    } else {
                        $result.html('<span style="color: red;">✗ ' + response.data.message + '</span>');
                    }
                }).fail(function() {
                    $btn.prop('disabled', false).text('Send Test Email');
                    $result.html('<span style="color: red;">✗ Request failed</span>');
                });
            });
        });
        </script>
        <?php
    }
    
    /**
     * AJAX: Check connection
     */
    public function ajaxCheckConnection() {
        check_ajax_referer('adsmedia_ajax', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Permission denied']);
        }
        
        $apiKey = get_option('adsmedia_api_key', '');
        
        if (empty($apiKey)) {
            wp_send_json_error(['message' => 'API key not configured']);
        }
        
        $response = $this->apiRequest('/ping', 'GET');
        
        if (is_wp_error($response)) {
            wp_send_json_error(['message' => $response->get_error_message()]);
        }
        
        wp_send_json_success(['message' => 'Connected successfully! API is working.']);
    }
    
    /**
     * AJAX: Send test email
     */
    public function ajaxTestEmail() {
        check_ajax_referer('adsmedia_ajax', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Permission denied']);
        }
        
        $to = sanitize_email($_POST['to'] ?? '');
        $subject = sanitize_text_field($_POST['subject'] ?? '');
        $message = sanitize_textarea_field($_POST['message'] ?? '');
        
        if (empty($to) || !is_email($to)) {
            wp_send_json_error(['message' => 'Invalid email address']);
        }
        
        $result = $this->sendEmail($to, $subject, $message);
        
        if (is_wp_error($result)) {
            wp_send_json_error(['message' => $result->get_error_message()]);
        }
        
        wp_send_json_success(['message' => 'Email sent successfully!']);
    }
    
    /**
     * Intercept wp_mail
     */
    public function interceptWpMail($return, $atts) {
        $to = $atts['to'];
        $subject = $atts['subject'];
        $message = $atts['message'];
        $headers = $atts['headers'] ?? '';
        
        // Handle multiple recipients
        if (is_array($to)) {
            $to = implode(', ', $to);
        }
        
        // Extract HTML if present
        $isHtml = false;
        if (is_array($headers)) {
            foreach ($headers as $header) {
                if (stripos($header, 'content-type: text/html') !== false) {
                    $isHtml = true;
                    break;
                }
            }
        } elseif (is_string($headers)) {
            if (stripos($headers, 'content-type: text/html') !== false) {
                $isHtml = true;
            }
        }
        
        $result = $this->sendEmail($to, $subject, $message, $isHtml);
        
        if (is_wp_error($result)) {
            $this->log('wp_mail failed: ' . $result->get_error_message());
            return false;
        }
        
        return true;
    }
    
    /**
     * Send email via ADSMedia API
     */
    public function sendEmail($to, $subject, $message, $isHtml = false) {
        $apiKey = get_option('adsmedia_api_key', '');
        
        if (empty($apiKey)) {
            return new WP_Error('no_api_key', 'ADSMedia API key not configured');
        }
        
        $fromName = get_option('adsmedia_from_name', get_bloginfo('name'));
        
        $body = [
            'to' => $to,
            'subject' => $subject,
            'from_name' => $fromName,
        ];
        
        if ($isHtml) {
            $body['html'] = $message;
            $body['type'] = 1; // HTML + text
        } else {
            $body['text'] = $message;
            $body['type'] = 3; // Text only
        }
        
        $response = $this->apiRequest('/send', 'POST', $body);
        
        if (is_wp_error($response)) {
            $this->log('Email send failed: ' . $response->get_error_message());
            return $response;
        }
        
        $this->log('Email sent to: ' . $to . ', Subject: ' . $subject);
        
        return true;
    }
    
    /**
     * Send batch emails
     */
    public function sendBatch($recipients, $subject, $html, $text = '', $preheader = '') {
        $apiKey = get_option('adsmedia_api_key', '');
        
        if (empty($apiKey)) {
            return new WP_Error('no_api_key', 'ADSMedia API key not configured');
        }
        
        $fromName = get_option('adsmedia_from_name', get_bloginfo('name'));
        
        $body = [
            'recipients' => $recipients,
            'subject' => $subject,
            'html' => $html,
            'from_name' => $fromName,
        ];
        
        if (!empty($text)) {
            $body['text'] = $text;
        }
        
        if (!empty($preheader)) {
            $body['preheader'] = $preheader;
        }
        
        return $this->apiRequest('/send/batch', 'POST', $body);
    }
    
    /**
     * API request
     */
    private function apiRequest($endpoint, $method = 'GET', $body = null) {
        $apiKey = get_option('adsmedia_api_key', '');
        
        $args = [
            'method' => $method,
            'headers' => [
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ],
            'timeout' => 30,
        ];
        
        if ($body !== null && $method !== 'GET') {
            $args['body'] = json_encode($body);
        }
        
        $url = ADSMEDIA_API_URL . $endpoint;
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $code = wp_remote_retrieve_response_code($response);
        $responseBody = wp_remote_retrieve_body($response);
        $data = json_decode($responseBody, true);
        
        if ($code >= 400) {
            $message = $data['error'] ?? $data['message'] ?? 'API error';
            return new WP_Error('api_error', $message);
        }
        
        return $data;
    }
    
    /**
     * Log message
     */
    private function log($message) {
        if (get_option('adsmedia_log_emails', false) && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
            error_log('[ADSMedia Email] ' . $message);
        }
    }
}

// Initialize plugin
add_action('plugins_loaded', function() {
    ADSMediaEmail::getInstance();
});

// Helper function for developers
function adsmedia_send_email($to, $subject, $message, $isHtml = false) {
    return ADSMediaEmail::getInstance()->sendEmail($to, $subject, $message, $isHtml);
}

function adsmedia_send_batch($recipients, $subject, $html, $text = '', $preheader = '') {
    return ADSMediaEmail::getInstance()->sendBatch($recipients, $subject, $html, $text, $preheader);
}

