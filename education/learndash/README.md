# ADSMedia + LearnDash Integration

Send course emails via ADSMedia from LearnDash LMS.

## Overview

LearnDash is a WordPress LMS plugin. This integration enables:
- Course enrollment notifications
- Lesson completion emails
- Certificate delivery
- Drip content notifications

## Setup

### 1. WordPress Plugin

Add this to your theme's `functions.php` or create a plugin:

```php
<?php
/**
 * Plugin Name: ADSMedia for LearnDash
 * Description: Send LearnDash emails via ADSMedia
 * Version: 1.0.0
 */

defined('ABSPATH') || exit;

class ADSMedia_LearnDash {
    
    private $api_key;
    private $from_name;
    
    public function __construct() {
        $this->api_key = get_option('adsmedia_api_key');
        $this->from_name = get_option('adsmedia_from_name', get_bloginfo('name'));
        
        // Hook into LearnDash actions
        add_action('learndash_update_course_access', [$this, 'on_course_enrollment'], 10, 4);
        add_action('learndash_lesson_completed', [$this, 'on_lesson_completed'], 10, 2);
        add_action('learndash_course_completed', [$this, 'on_course_completed'], 10, 2);
        add_action('learndash_quiz_completed', [$this, 'on_quiz_completed'], 10, 2);
        add_action('learndash_topic_completed', [$this, 'on_topic_completed'], 10, 2);
        
        // Admin settings
        add_action('admin_menu', [$this, 'add_settings_page']);
        add_action('admin_init', [$this, 'register_settings']);
    }
    
    private function send_email($to, $to_name, $subject, $html) {
        if (empty($this->api_key)) {
            return false;
        }
        
        $response = wp_remote_post('https://api.adsmedia.live/v1/send', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->api_key,
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode([
                'to' => $to,
                'to_name' => $to_name,
                'subject' => $subject,
                'html' => $html,
                'from_name' => $this->from_name,
            ]),
            'timeout' => 30,
        ]);
        
        return !is_wp_error($response);
    }
    
    public function on_course_enrollment($user_id, $course_id, $access_list, $remove) {
        if ($remove) return; // Skip if removing access
        
        $user = get_user_by('id', $user_id);
        $course = get_post($course_id);
        
        $html = $this->get_template('enrollment', [
            'user_name' => $user->display_name,
            'course_title' => $course->post_title,
            'course_url' => get_permalink($course_id),
            'course_image' => get_the_post_thumbnail_url($course_id, 'large'),
        ]);
        
        $this->send_email(
            $user->user_email,
            $user->display_name,
            "Welcome to {$course->post_title}! 🎓",
            $html
        );
    }
    
    public function on_lesson_completed($data) {
        $user = get_user_by('id', $data['user']->ID);
        $lesson = get_post($data['lesson']->ID);
        $course = get_post($data['course']->ID);
        
        // Calculate progress
        $progress = learndash_course_progress([
            'user_id' => $user->ID,
            'course_id' => $course->ID,
            'array' => true,
        ]);
        
        $html = $this->get_template('lesson_completed', [
            'user_name' => $user->display_name,
            'lesson_title' => $lesson->post_title,
            'course_title' => $course->post_title,
            'progress' => $progress['percentage'],
            'next_lesson_url' => $this->get_next_lesson_url($lesson->ID, $course->ID),
        ]);
        
        $this->send_email(
            $user->user_email,
            $user->display_name,
            "Lesson Completed: {$lesson->post_title} ✅",
            $html
        );
    }
    
    public function on_course_completed($data) {
        $user = get_user_by('id', $data['user']->ID);
        $course = get_post($data['course']->ID);
        
        // Get certificate link if available
        $certificate_link = learndash_get_course_certificate_link($course->ID, $user->ID);
        
        $html = $this->get_template('course_completed', [
            'user_name' => $user->display_name,
            'course_title' => $course->post_title,
            'certificate_link' => $certificate_link,
        ]);
        
        $this->send_email(
            $user->user_email,
            $user->display_name,
            "Congratulations! You've Completed {$course->post_title} 🎉",
            $html
        );
    }
    
    public function on_quiz_completed($data, $user) {
        $quiz = get_post($data['quiz']);
        $passed = $data['pass'] ?? false;
        $score = $data['percentage'] ?? 0;
        
        $html = $this->get_template('quiz_completed', [
            'user_name' => $user->display_name,
            'quiz_title' => $quiz->post_title,
            'passed' => $passed,
            'score' => $score,
        ]);
        
        $subject = $passed 
            ? "Quiz Passed: {$quiz->post_title} 🎉" 
            : "Quiz Results: {$quiz->post_title}";
        
        $this->send_email(
            $user->user_email,
            $user->display_name,
            $subject,
            $html
        );
    }
    
    private function get_template($name, $vars) {
        $templates = [
            'enrollment' => '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Welcome to Your New Course! 🎓</h1>
                    </div>
                    {course_image}
                    <div style="padding: 30px;">
                        <p>Hi {user_name},</p>
                        <p>You\'ve been enrolled in <strong>{course_title}</strong>!</p>
                        <p>Start learning now and unlock your potential.</p>
                        <p style="text-align: center; margin-top: 30px;">
                            <a href="{course_url}" style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 4px;">Start Learning</a>
                        </p>
                    </div>
                </div>
            ',
            'lesson_completed' => '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #10B981; padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Lesson Completed! ✅</h1>
                    </div>
                    <div style="padding: 30px;">
                        <p>Great job, {user_name}!</p>
                        <p>You\'ve completed <strong>{lesson_title}</strong>.</p>
                        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0;">Course Progress: <strong>{progress}%</strong></p>
                            <div style="background: #e0e0e0; height: 10px; border-radius: 5px; margin-top: 10px;">
                                <div style="background: #10B981; height: 10px; border-radius: 5px; width: {progress}%;"></div>
                            </div>
                        </div>
                        <p style="text-align: center;">
                            <a href="{next_lesson_url}" style="background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">Continue Learning →</a>
                        </p>
                    </div>
                </div>
            ',
            'course_completed' => '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 50px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Congratulations! 🎉</h1>
                    </div>
                    <div style="padding: 30px; text-align: center;">
                        <p style="font-size: 18px;">Well done, {user_name}!</p>
                        <p>You\'ve successfully completed</p>
                        <h2 style="color: #4F46E5;">{course_title}</h2>
                        {certificate_section}
                        <p>Keep up the great work!</p>
                    </div>
                </div>
            ',
            'quiz_completed' => '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: {header_bg}; padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">{header_text}</h1>
                    </div>
                    <div style="padding: 30px; text-align: center;">
                        <p>Hi {user_name},</p>
                        <p style="font-size: 48px; margin: 20px 0;">{score}%</p>
                        <p>{result_message}</p>
                    </div>
                </div>
            ',
        ];
        
        $html = $templates[$name] ?? '';
        
        // Replace variables
        foreach ($vars as $key => $value) {
            if ($key === 'course_image' && $value) {
                $value = '<img src="' . $value . '" alt="" style="width: 100%;">';
            }
            if ($key === 'certificate_link' && $value) {
                $value = '<p style="margin: 30px 0;"><a href="' . $value . '" style="background: #4F46E5; color: white; padding: 15px 40px; text-decoration: none; border-radius: 4px;">Download Certificate</a></p>';
                $html = str_replace('{certificate_section}', $value, $html);
            }
            if ($key === 'passed') {
                $html = str_replace('{header_bg}', $value ? '#10B981' : '#F59E0B', $html);
                $html = str_replace('{header_text}', $value ? 'Quiz Passed! 🎉' : 'Quiz Results', $html);
                $html = str_replace('{result_message}', $value ? 'Congratulations on passing!' : 'Keep practicing and try again!', $html);
            }
            $html = str_replace('{' . $key . '}', $value, $html);
        }
        
        // Clean up unreplaced placeholders
        $html = preg_replace('/\{[^}]+\}/', '', $html);
        
        return $html;
    }
    
    private function get_next_lesson_url($lesson_id, $course_id) {
        // Get next lesson in course
        $lessons = learndash_get_lesson_list($course_id);
        $found = false;
        
        foreach ($lessons as $lesson) {
            if ($found) {
                return get_permalink($lesson->ID);
            }
            if ($lesson->ID == $lesson_id) {
                $found = true;
            }
        }
        
        return get_permalink($course_id);
    }
    
    public function add_settings_page() {
        add_submenu_page(
            'learndash-lms',
            'ADSMedia Email',
            'ADSMedia Email',
            'manage_options',
            'adsmedia-learndash',
            [$this, 'render_settings_page']
        );
    }
    
    public function register_settings() {
        register_setting('adsmedia_learndash', 'adsmedia_api_key');
        register_setting('adsmedia_learndash', 'adsmedia_from_name');
    }
    
    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>ADSMedia for LearnDash</h1>
            <form method="post" action="options.php">
                <?php settings_fields('adsmedia_learndash'); ?>
                <table class="form-table">
                    <tr>
                        <th>API Key</th>
                        <td><input type="password" name="adsmedia_api_key" value="<?php echo esc_attr(get_option('adsmedia_api_key')); ?>" class="regular-text"></td>
                    </tr>
                    <tr>
                        <th>From Name</th>
                        <td><input type="text" name="adsmedia_from_name" value="<?php echo esc_attr(get_option('adsmedia_from_name', get_bloginfo('name'))); ?>" class="regular-text"></td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
}

new ADSMedia_LearnDash();
```

## Triggered Emails

| Event | Email Subject |
|-------|--------------|
| Course Enrollment | "Welcome to {Course Title}!" |
| Lesson Completed | "Lesson Completed: {Lesson Title}" |
| Course Completed | "Congratulations! You've Completed {Course}" |
| Quiz Passed | "Quiz Passed: {Quiz Title}" |
| Quiz Failed | "Quiz Results: {Quiz Title}" |

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [LearnDash](https://www.learndash.com)
- [LearnDash Hooks](https://developers.learndash.com)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

