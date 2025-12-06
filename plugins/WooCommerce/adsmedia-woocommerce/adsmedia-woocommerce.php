<?php
/**
 * Plugin Name: ADSMedia for WooCommerce
 * Plugin URI: https://adsmedia.ai
 * Description: Send WooCommerce transactional emails via ADSMedia API. Order confirmations, shipping notifications, and more.
 * Version: 1.0.0
 * Author: ADSMedia
 * Author URI: https://adsmedia.ai
 * License: GPL v2 or later
 * Text Domain: adsmedia-woocommerce
 * Requires Plugins: woocommerce
 * WC requires at least: 5.0
 * WC tested up to: 8.4
 */

if (!defined('ABSPATH')) {
    exit;
}

// Check if WooCommerce is active
if (!in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
    add_action('admin_notices', function() {
        echo '<div class="notice notice-error"><p><strong>ADSMedia for WooCommerce</strong> requires WooCommerce to be installed and active.</p></div>';
    });
    return;
}

define('ADSMEDIA_WC_VERSION', '1.0.0');
define('ADSMEDIA_WC_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ADSMEDIA_WC_PLUGIN_URL', plugin_dir_url(__FILE__));
define('ADSMEDIA_WC_API_URL', 'https://api.adsmedia.live/v1');

class ADSMediaWooCommerce {
    
    private static $instance = null;
    private $apiKey = '';
    
    // WooCommerce email types
    private $emailTypes = [
        'new_order' => 'New Order (Admin)',
        'cancelled_order' => 'Cancelled Order (Admin)',
        'failed_order' => 'Failed Order (Admin)',
        'customer_on_hold_order' => 'Order On-Hold',
        'customer_processing_order' => 'Processing Order',
        'customer_completed_order' => 'Completed Order',
        'customer_refunded_order' => 'Refunded Order',
        'customer_invoice' => 'Customer Invoice',
        'customer_note' => 'Customer Note',
        'customer_reset_password' => 'Reset Password',
        'customer_new_account' => 'New Account',
    ];
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->apiKey = get_option('adsmedia_wc_api_key', '');
        
        // Admin menu
        add_action('admin_menu', [$this, 'addAdminMenu']);
        add_action('admin_init', [$this, 'registerSettings']);
        
        // WooCommerce hooks
        if (!empty($this->apiKey) && get_option('adsmedia_wc_enabled', false)) {
            // Intercept WooCommerce emails
            add_filter('woocommerce_mail_callback', [$this, 'interceptMailCallback'], 10, 1);
            
            // Custom email sending
            add_action('woocommerce_email_sent', [$this, 'logEmailSent'], 10, 3);
        }
        
        // AJAX handlers
        add_action('wp_ajax_adsmedia_wc_test_email', [$this, 'ajaxTestEmail']);
        add_action('wp_ajax_adsmedia_wc_check_connection', [$this, 'ajaxCheckConnection']);
        add_action('wp_ajax_adsmedia_wc_send_order_email', [$this, 'ajaxSendOrderEmail']);
        
        // Admin notices
        add_action('admin_notices', [$this, 'adminNotices']);
        
        // Add settings link
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), [$this, 'addSettingsLink']);
        
        // HPOS compatibility
        add_action('before_woocommerce_init', function() {
            if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
                \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
            }
        });
    }
    
    /**
     * Add settings link to plugins page
     */
    public function addSettingsLink($links) {
        $settingsLink = '<a href="' . admin_url('admin.php?page=adsmedia-woocommerce') . '">Settings</a>';
        array_unshift($links, $settingsLink);
        return $links;
    }
    
    /**
     * Add admin menu under WooCommerce
     */
    public function addAdminMenu() {
        add_submenu_page(
            'woocommerce',
            'ADSMedia Email',
            'ADSMedia Email',
            'manage_woocommerce',
            'adsmedia-woocommerce',
            [$this, 'renderSettingsPage']
        );
    }
    
    /**
     * Register settings
     */
    public function registerSettings() {
        register_setting('adsmedia_wc_settings', 'adsmedia_wc_api_key');
        register_setting('adsmedia_wc_settings', 'adsmedia_wc_enabled');
        register_setting('adsmedia_wc_settings', 'adsmedia_wc_from_name');
        register_setting('adsmedia_wc_settings', 'adsmedia_wc_log_emails');
        register_setting('adsmedia_wc_settings', 'adsmedia_wc_email_types');
    }
    
    /**
     * Admin notices
     */
    public function adminNotices() {
        if (empty($this->apiKey) && current_user_can('manage_woocommerce')) {
            $screen = get_current_screen();
            if ($screen && strpos($screen->id, 'woocommerce') !== false) {
                $settingsUrl = admin_url('admin.php?page=adsmedia-woocommerce');
                echo '<div class="notice notice-warning is-dismissible">';
                echo '<p><strong>ADSMedia for WooCommerce:</strong> ';
                echo sprintf('Please <a href="%s">configure your API key</a> to enable email sending.', esc_url($settingsUrl));
                echo '</p></div>';
            }
        }
    }
    
    /**
     * Render settings page
     */
    public function renderSettingsPage() {
        if (!current_user_can('manage_woocommerce')) {
            return;
        }
        
        // Handle form submission
        if (isset($_POST['adsmedia_wc_save_settings']) && check_admin_referer('adsmedia_wc_settings_nonce')) {
            update_option('adsmedia_wc_api_key', sanitize_text_field($_POST['adsmedia_wc_api_key'] ?? ''));
            update_option('adsmedia_wc_enabled', isset($_POST['adsmedia_wc_enabled']) ? 1 : 0);
            update_option('adsmedia_wc_from_name', sanitize_text_field($_POST['adsmedia_wc_from_name'] ?? ''));
            update_option('adsmedia_wc_log_emails', isset($_POST['adsmedia_wc_log_emails']) ? 1 : 0);
            
            $emailTypes = isset($_POST['adsmedia_wc_email_types']) ? array_map('sanitize_text_field', $_POST['adsmedia_wc_email_types']) : [];
            update_option('adsmedia_wc_email_types', $emailTypes);
            
            $this->apiKey = get_option('adsmedia_wc_api_key', '');
            
            echo '<div class="notice notice-success is-dismissible"><p>Settings saved!</p></div>';
        }
        
        $apiKey = get_option('adsmedia_wc_api_key', '');
        $enabled = get_option('adsmedia_wc_enabled', false);
        $fromName = get_option('adsmedia_wc_from_name', get_bloginfo('name'));
        $logEmails = get_option('adsmedia_wc_log_emails', false);
        $enabledEmailTypes = get_option('adsmedia_wc_email_types', array_keys($this->emailTypes));
        
        // Get recent orders for testing
        $recentOrders = wc_get_orders([
            'limit' => 5,
            'orderby' => 'date',
            'order' => 'DESC',
        ]);
        
        ?>
        <div class="wrap">
            <h1>
                <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM3ZjU0YjMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNNCA0aDE2YzEuMSAwIDIgLjkgMiAydjEyYzAgMS4xLS45IDItMiAySDRjLTEuMSAwLTItLjktMi0yVjZjMC0xLjEuOS0yIDItMnoiPjwvcGF0aD48cG9seWxpbmUgcG9pbnRzPSIyMiw2IDEyLDEzIDIsNiI+PC9wb2x5bGluZT48L3N2Zz4=" 
                     style="vertical-align: middle; margin-right: 10px;" alt="">
                ADSMedia for WooCommerce
            </h1>
            
            <div style="display: flex; gap: 20px; margin-top: 20px;">
                <!-- Settings Form -->
                <div style="flex: 1; max-width: 700px;">
                    <form method="post" action="">
                        <?php wp_nonce_field('adsmedia_wc_settings_nonce'); ?>
                        
                        <div class="card" style="max-width: 100%; padding: 20px; margin-bottom: 20px;">
                            <h2 style="margin-top: 0;">API Settings</h2>
                            
                            <table class="form-table">
                                <tr>
                                    <th scope="row">
                                        <label for="adsmedia_wc_api_key">API Key</label>
                                    </th>
                                    <td>
                                        <input type="password" 
                                               id="adsmedia_wc_api_key" 
                                               name="adsmedia_wc_api_key" 
                                               value="<?php echo esc_attr($apiKey); ?>" 
                                               class="regular-text"
                                               autocomplete="off">
                                        <button type="button" 
                                                id="adsmedia-wc-check-connection" 
                                                class="button"
                                                style="margin-left: 10px;">
                                            Test Connection
                                        </button>
                                        <p class="description">
                                            Get your API key from <a href="https://adsmedia.ai" target="_blank">adsmedia.ai</a>
                                        </p>
                                        <div id="connection-status" style="margin-top: 5px;"></div>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Enable</th>
                                    <td>
                                        <label>
                                            <input type="checkbox" 
                                                   name="adsmedia_wc_enabled" 
                                                   value="1" 
                                                   <?php checked($enabled, 1); ?>>
                                            Send WooCommerce emails through ADSMedia
                                        </label>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <label for="adsmedia_wc_from_name">From Name</label>
                                    </th>
                                    <td>
                                        <input type="text" 
                                               id="adsmedia_wc_from_name" 
                                               name="adsmedia_wc_from_name" 
                                               value="<?php echo esc_attr($fromName); ?>" 
                                               class="regular-text">
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">Log Emails</th>
                                    <td>
                                        <label>
                                            <input type="checkbox" 
                                                   name="adsmedia_wc_log_emails" 
                                                   value="1" 
                                                   <?php checked($logEmails, 1); ?>>
                                            Log sent emails (requires WP_DEBUG_LOG)
                                        </label>
                                    </td>
                                </tr>
                            </table>
                        </div>
                        
                        <div class="card" style="max-width: 100%; padding: 20px; margin-bottom: 20px;">
                            <h2 style="margin-top: 0;">Email Types</h2>
                            <p>Select which WooCommerce emails to send through ADSMedia:</p>
                            
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                                <?php foreach ($this->emailTypes as $key => $label): ?>
                                <label style="display: flex; align-items: center; gap: 8px;">
                                    <input type="checkbox" 
                                           name="adsmedia_wc_email_types[]" 
                                           value="<?php echo esc_attr($key); ?>"
                                           <?php checked(in_array($key, $enabledEmailTypes)); ?>>
                                    <?php echo esc_html($label); ?>
                                </label>
                                <?php endforeach; ?>
                            </div>
                        </div>
                        
                        <p class="submit">
                            <input type="submit" 
                                   name="adsmedia_wc_save_settings" 
                                   class="button button-primary" 
                                   value="Save Settings">
                        </p>
                    </form>
                </div>
                
                <!-- Test Panel -->
                <div style="flex: 0 0 350px;">
                    <div class="card" style="padding: 20px; margin-bottom: 20px;">
                        <h2 style="margin-top: 0;">📧 Send Test Email</h2>
                        
                        <p>
                            <label><strong>To:</strong></label><br>
                            <input type="email" 
                                   id="test_email_to" 
                                   value="<?php echo esc_attr(get_option('admin_email')); ?>" 
                                   style="width: 100%;">
                        </p>
                        
                        <p>
                            <button type="button" 
                                    id="adsmedia-wc-send-test" 
                                    class="button button-primary"
                                    <?php echo empty($apiKey) ? 'disabled' : ''; ?>>
                                Send Test Email
                            </button>
                        </p>
                        
                        <div id="test-email-result"></div>
                    </div>
                    
                    <?php if (!empty($recentOrders)): ?>
                    <div class="card" style="padding: 20px;">
                        <h2 style="margin-top: 0;">📦 Resend Order Email</h2>
                        
                        <p>
                            <label><strong>Select Order:</strong></label><br>
                            <select id="resend_order_id" style="width: 100%;">
                                <?php foreach ($recentOrders as $order): ?>
                                <option value="<?php echo $order->get_id(); ?>">
                                    #<?php echo $order->get_order_number(); ?> - 
                                    <?php echo $order->get_billing_email(); ?> - 
                                    <?php echo wc_price($order->get_total()); ?>
                                </option>
                                <?php endforeach; ?>
                            </select>
                        </p>
                        
                        <p>
                            <label><strong>Email Type:</strong></label><br>
                            <select id="resend_email_type" style="width: 100%;">
                                <option value="customer_processing_order">Processing Order</option>
                                <option value="customer_completed_order">Completed Order</option>
                                <option value="customer_invoice">Invoice</option>
                                <option value="customer_on_hold_order">On-Hold Order</option>
                            </select>
                        </p>
                        
                        <p>
                            <button type="button" 
                                    id="adsmedia-wc-resend-order" 
                                    class="button"
                                    <?php echo empty($apiKey) ? 'disabled' : ''; ?>>
                                Resend Email
                            </button>
                        </p>
                        
                        <div id="resend-order-result"></div>
                    </div>
                    <?php endif; ?>
                    
                    <div class="card" style="padding: 20px; background: #f0f0f1;">
                        <h3 style="margin-top: 0;">📊 Statistics</h3>
                        <p>
                            <strong>Emails sent today:</strong> 
                            <?php echo intval(get_transient('adsmedia_wc_emails_today') ?: 0); ?>
                        </p>
                        <p>
                            <strong>Status:</strong> 
                            <?php if ($enabled && !empty($apiKey)): ?>
                                <span style="color: green;">✓ Active</span>
                            <?php else: ?>
                                <span style="color: orange;">○ Inactive</span>
                            <?php endif; ?>
                        </p>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            // Check connection
            $('#adsmedia-wc-check-connection').on('click', function() {
                var $btn = $(this);
                var $status = $('#connection-status');
                
                $btn.prop('disabled', true).text('Checking...');
                
                $.post(ajaxurl, {
                    action: 'adsmedia_wc_check_connection',
                    nonce: '<?php echo wp_create_nonce('adsmedia_wc_ajax'); ?>',
                    api_key: $('#adsmedia_wc_api_key').val()
                }, function(response) {
                    $btn.prop('disabled', false).text('Test Connection');
                    
                    if (response.success) {
                        $status.html('<span style="color: green;">✓ ' + response.data.message + '</span>');
                    } else {
                        $status.html('<span style="color: red;">✗ ' + response.data.message + '</span>');
                    }
                });
            });
            
            // Send test email
            $('#adsmedia-wc-send-test').on('click', function() {
                var $btn = $(this);
                var $result = $('#test-email-result');
                var to = $('#test_email_to').val();
                
                $btn.prop('disabled', true).text('Sending...');
                $result.html('<span style="color: #666;">Sending...</span>');
                
                $.post(ajaxurl, {
                    action: 'adsmedia_wc_test_email',
                    nonce: '<?php echo wp_create_nonce('adsmedia_wc_ajax'); ?>',
                    to: to
                }, function(response) {
                    $btn.prop('disabled', false).text('Send Test Email');
                    
                    if (response.success) {
                        $result.html('<span style="color: green;">✓ ' + response.data.message + '</span>');
                    } else {
                        $result.html('<span style="color: red;">✗ ' + response.data.message + '</span>');
                    }
                });
            });
            
            // Resend order email
            $('#adsmedia-wc-resend-order').on('click', function() {
                var $btn = $(this);
                var $result = $('#resend-order-result');
                var orderId = $('#resend_order_id').val();
                var emailType = $('#resend_email_type').val();
                
                $btn.prop('disabled', true).text('Sending...');
                $result.html('<span style="color: #666;">Sending...</span>');
                
                $.post(ajaxurl, {
                    action: 'adsmedia_wc_send_order_email',
                    nonce: '<?php echo wp_create_nonce('adsmedia_wc_ajax'); ?>',
                    order_id: orderId,
                    email_type: emailType
                }, function(response) {
                    $btn.prop('disabled', false).text('Resend Email');
                    
                    if (response.success) {
                        $result.html('<span style="color: green;">✓ ' + response.data.message + '</span>');
                    } else {
                        $result.html('<span style="color: red;">✗ ' + response.data.message + '</span>');
                    }
                });
            });
        });
        </script>
        <?php
    }
    
    /**
     * Intercept WooCommerce mail callback
     */
    public function interceptMailCallback($callback) {
        return [$this, 'sendMail'];
    }
    
    /**
     * Custom mail sending function
     */
    public function sendMail($to, $subject, $message, $headers = '', $attachments = []) {
        // Check if this email type is enabled
        $currentEmailType = $this->getCurrentEmailType();
        $enabledTypes = get_option('adsmedia_wc_email_types', array_keys($this->emailTypes));
        
        if ($currentEmailType && !in_array($currentEmailType, $enabledTypes)) {
            // Fall back to default WordPress mail
            return wp_mail($to, $subject, $message, $headers, $attachments);
        }
        
        $fromName = get_option('adsmedia_wc_from_name', get_bloginfo('name'));
        
        // Detect HTML
        $isHtml = (stripos($headers, 'text/html') !== false) || (stripos($message, '<html') !== false);
        
        $body = [
            'to' => is_array($to) ? implode(', ', $to) : $to,
            'subject' => $subject,
            'from_name' => $fromName,
            'type' => $isHtml ? 1 : 3,
        ];
        
        if ($isHtml) {
            $body['html'] = $message;
        } else {
            $body['text'] = $message;
        }
        
        $response = $this->apiRequest('/send', 'POST', $body);
        
        if (is_wp_error($response)) {
            $this->log('Email failed: ' . $response->get_error_message());
            // Fall back to default
            return wp_mail($to, $subject, $message, $headers, $attachments);
        }
        
        $this->log('Email sent via ADSMedia: ' . $to . ' - ' . $subject);
        $this->incrementEmailCount();
        
        return true;
    }
    
    /**
     * Get current email type being sent
     */
    private function getCurrentEmailType() {
        if (!class_exists('WC_Emails')) {
            return null;
        }
        
        $emails = WC_Emails::instance();
        foreach ($emails->get_emails() as $email) {
            if ($email->is_enabled() && isset($email->id)) {
                return $email->id;
            }
        }
        
        return null;
    }
    
    /**
     * AJAX: Check connection
     */
    public function ajaxCheckConnection() {
        check_ajax_referer('adsmedia_wc_ajax', 'nonce');
        
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(['message' => 'Permission denied']);
        }
        
        $apiKey = sanitize_text_field($_POST['api_key'] ?? '');
        
        if (empty($apiKey)) {
            $apiKey = get_option('adsmedia_wc_api_key', '');
        }
        
        if (empty($apiKey)) {
            wp_send_json_error(['message' => 'API key not provided']);
        }
        
        // Temporarily set API key for this request
        $this->apiKey = $apiKey;
        
        $response = $this->apiRequest('/ping', 'GET');
        
        if (is_wp_error($response)) {
            wp_send_json_error(['message' => $response->get_error_message()]);
        }
        
        wp_send_json_success(['message' => 'Connected successfully!']);
    }
    
    /**
     * AJAX: Send test email
     */
    public function ajaxTestEmail() {
        check_ajax_referer('adsmedia_wc_ajax', 'nonce');
        
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(['message' => 'Permission denied']);
        }
        
        $to = sanitize_email($_POST['to'] ?? '');
        
        if (empty($to) || !is_email($to)) {
            wp_send_json_error(['message' => 'Invalid email address']);
        }
        
        $siteName = get_bloginfo('name');
        $subject = "Test Email from {$siteName} (ADSMedia)";
        
        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #7f54b3, #9b6bc9); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0;">✓ Test Successful!</h1>
                </div>
                <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 8px 8px;">
                    <p>Hello!</p>
                    <p>This is a test email from <strong>' . esc_html($siteName) . '</strong> sent via ADSMedia for WooCommerce plugin.</p>
                    <p>If you received this email, your configuration is working correctly!</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">
                        Sent via <a href="https://adsmedia.ai" style="color: #7f54b3;">ADSMedia Email API</a>
                    </p>
                </div>
            </div>
        </body>
        </html>';
        
        $body = [
            'to' => $to,
            'subject' => $subject,
            'html' => $html,
            'from_name' => get_option('adsmedia_wc_from_name', $siteName),
            'type' => 1,
        ];
        
        $response = $this->apiRequest('/send', 'POST', $body);
        
        if (is_wp_error($response)) {
            wp_send_json_error(['message' => $response->get_error_message()]);
        }
        
        $this->incrementEmailCount();
        wp_send_json_success(['message' => 'Test email sent successfully!']);
    }
    
    /**
     * AJAX: Send order email
     */
    public function ajaxSendOrderEmail() {
        check_ajax_referer('adsmedia_wc_ajax', 'nonce');
        
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(['message' => 'Permission denied']);
        }
        
        $orderId = intval($_POST['order_id'] ?? 0);
        $emailType = sanitize_text_field($_POST['email_type'] ?? '');
        
        if (!$orderId) {
            wp_send_json_error(['message' => 'Invalid order ID']);
        }
        
        $order = wc_get_order($orderId);
        
        if (!$order) {
            wp_send_json_error(['message' => 'Order not found']);
        }
        
        // Trigger WooCommerce email
        $emails = WC()->mailer()->get_emails();
        
        if (isset($emails[$emailType])) {
            $emails[$emailType]->trigger($orderId, $order);
            wp_send_json_success(['message' => 'Order email sent to ' . $order->get_billing_email()]);
        }
        
        wp_send_json_error(['message' => 'Email type not found']);
    }
    
    /**
     * API request
     */
    private function apiRequest($endpoint, $method = 'GET', $body = null) {
        $apiKey = $this->apiKey ?: get_option('adsmedia_wc_api_key', '');
        
        if (empty($apiKey)) {
            return new WP_Error('no_api_key', 'API key not configured');
        }
        
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
        
        $url = ADSMEDIA_WC_API_URL . $endpoint;
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
        if (get_option('adsmedia_wc_log_emails', false) && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
            error_log('[ADSMedia WooCommerce] ' . $message);
        }
    }
    
    /**
     * Increment daily email count
     */
    private function incrementEmailCount() {
        $count = intval(get_transient('adsmedia_wc_emails_today') ?: 0);
        set_transient('adsmedia_wc_emails_today', $count + 1, DAY_IN_SECONDS);
    }
    
    /**
     * Log email sent
     */
    public function logEmailSent($return, $recipient, $email) {
        $emailType = is_object($email) ? get_class($email) : 'unknown';
        $this->log('WooCommerce email sent to: ' . $recipient . ' (' . $emailType . ')');
    }
}

// Initialize
add_action('plugins_loaded', function() {
    if (class_exists('WooCommerce')) {
        ADSMediaWooCommerce::getInstance();
    }
});

// Helper function
function adsmedia_wc_send_email($to, $subject, $html, $text = '') {
    $instance = ADSMediaWooCommerce::getInstance();
    return $instance->sendMail($to, $subject, $html, 'Content-Type: text/html');
}

