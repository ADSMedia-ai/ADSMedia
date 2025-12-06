# ADSMedia + Moodle Integration

Send course emails via ADSMedia from Moodle LMS.

## Overview

Moodle is an open-source learning management system. This integration enables:
- Course enrollment notifications
- Assignment submissions
- Grade notifications
- Forum post alerts

## Setup

### 1. Moodle Local Plugin

Create plugin structure:

```
local/adsmedia/
├── classes/
│   └── email_sender.php
├── db/
│   └── events.php
├── lang/
│   └── en/
│       └── local_adsmedia.php
├── settings.php
└── version.php
```

### 2. Version File

```php
<?php
// local/adsmedia/version.php

defined('MOODLE_INTERNAL') || die();

$plugin->version = 2024120600;
$plugin->requires = 2022041900;
$plugin->component = 'local_adsmedia';
$plugin->maturity = MATURITY_STABLE;
$plugin->release = '1.0.0';
```

### 3. Email Sender Class

```php
<?php
// local/adsmedia/classes/email_sender.php

namespace local_adsmedia;

defined('MOODLE_INTERNAL') || die();

class email_sender {
    
    private $api_key;
    private $from_name;
    
    public function __construct() {
        $this->api_key = get_config('local_adsmedia', 'api_key');
        $this->from_name = get_config('local_adsmedia', 'from_name') ?: get_config('core', 'sitename');
    }
    
    public function send($to, $to_name, $subject, $html) {
        if (empty($this->api_key)) {
            debugging('ADSMedia API key not configured', DEBUG_DEVELOPER);
            return false;
        }
        
        $data = json_encode([
            'to' => $to,
            'to_name' => $to_name,
            'subject' => $subject,
            'html' => $html,
            'from_name' => $this->from_name,
        ]);
        
        $ch = curl_init('https://api.adsmedia.live/v1/send');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->api_key,
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => $data,
            CURLOPT_TIMEOUT => 30,
        ]);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($http_code !== 200) {
            debugging('ADSMedia API error: ' . $response, DEBUG_DEVELOPER);
            return false;
        }
        
        return true;
    }
    
    public function get_template($name, $vars = []) {
        $templates = [
            'enrollment' => '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #FF6600; padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Welcome to Your Course! 🎓</h1>
                    </div>
                    <div style="padding: 30px;">
                        <p>Hi {fullname},</p>
                        <p>You have been enrolled in <strong>{coursename}</strong>.</p>
                        <p>Get started now and begin your learning journey!</p>
                        <p style="text-align: center; margin-top: 30px;">
                            <a href="{courseurl}" style="background: #FF6600; color: white; padding: 15px 40px; text-decoration: none; border-radius: 4px;">Go to Course</a>
                        </p>
                    </div>
                </div>
            ',
            'assignment_submitted' => '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #10B981; padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Assignment Submitted! ✅</h1>
                    </div>
                    <div style="padding: 30px;">
                        <p>Hi {fullname},</p>
                        <p>Your assignment <strong>{assignmentname}</strong> in {coursename} has been submitted successfully.</p>
                        <p>Submission time: {submittime}</p>
                        <p>Your instructor will review and provide feedback soon.</p>
                    </div>
                </div>
            ',
            'grade_received' => '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #4F46E5; padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Grade Posted! 📊</h1>
                    </div>
                    <div style="padding: 30px;">
                        <p>Hi {fullname},</p>
                        <p>A grade has been posted for <strong>{itemname}</strong> in {coursename}.</p>
                        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                            <p style="font-size: 48px; margin: 0; color: #4F46E5;">{grade}</p>
                            <p style="margin: 0; color: #666;">Your Grade</p>
                        </div>
                        <p style="text-align: center;">
                            <a href="{gradeurl}" style="background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">View Details</a>
                        </p>
                    </div>
                </div>
            ',
            'course_completed' => '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 50px; text-align: center;">
                        <h1 style="color: white; margin: 0;">🎉 Congratulations! 🎉</h1>
                    </div>
                    <div style="padding: 30px; text-align: center;">
                        <p style="font-size: 18px;">Well done, {fullname}!</p>
                        <p>You have successfully completed</p>
                        <h2 style="color: #4F46E5;">{coursename}</h2>
                        {certificate_link}
                    </div>
                </div>
            ',
        ];
        
        $html = $templates[$name] ?? '';
        
        foreach ($vars as $key => $value) {
            $html = str_replace('{' . $key . '}', $value, $html);
        }
        
        return $html;
    }
}
```

### 4. Event Observers

```php
<?php
// local/adsmedia/db/events.php

defined('MOODLE_INTERNAL') || die();

$observers = [
    [
        'eventname' => '\core\event\user_enrolment_created',
        'callback' => '\local_adsmedia\observer::user_enrolled',
    ],
    [
        'eventname' => '\mod_assign\event\assessable_submitted',
        'callback' => '\local_adsmedia\observer::assignment_submitted',
    ],
    [
        'eventname' => '\core\event\user_graded',
        'callback' => '\local_adsmedia\observer::user_graded',
    ],
    [
        'eventname' => '\core\event\course_completed',
        'callback' => '\local_adsmedia\observer::course_completed',
    ],
];
```

### 5. Observer Class

```php
<?php
// local/adsmedia/classes/observer.php

namespace local_adsmedia;

defined('MOODLE_INTERNAL') || die();

class observer {
    
    public static function user_enrolled(\core\event\user_enrolment_created $event) {
        global $DB;
        
        $user = $DB->get_record('user', ['id' => $event->relateduserid]);
        $course = get_course($event->courseid);
        
        $sender = new email_sender();
        $html = $sender->get_template('enrollment', [
            'fullname' => fullname($user),
            'coursename' => $course->fullname,
            'courseurl' => (new \moodle_url('/course/view.php', ['id' => $course->id]))->out(),
        ]);
        
        $sender->send(
            $user->email,
            fullname($user),
            "Welcome to {$course->fullname}!",
            $html
        );
    }
    
    public static function assignment_submitted(\mod_assign\event\assessable_submitted $event) {
        global $DB;
        
        $user = $DB->get_record('user', ['id' => $event->userid]);
        $course = get_course($event->courseid);
        $cm = get_coursemodule_from_id('assign', $event->contextinstanceid);
        $assign = $DB->get_record('assign', ['id' => $cm->instance]);
        
        $sender = new email_sender();
        $html = $sender->get_template('assignment_submitted', [
            'fullname' => fullname($user),
            'assignmentname' => $assign->name,
            'coursename' => $course->fullname,
            'submittime' => userdate(time()),
        ]);
        
        $sender->send(
            $user->email,
            fullname($user),
            "Assignment Submitted: {$assign->name}",
            $html
        );
    }
    
    public static function user_graded(\core\event\user_graded $event) {
        global $DB;
        
        $user = $DB->get_record('user', ['id' => $event->relateduserid]);
        $gradeitem = $DB->get_record('grade_items', ['id' => $event->other['itemid']]);
        $course = get_course($gradeitem->courseid);
        $grade = $DB->get_record('grade_grades', ['id' => $event->objectid]);
        
        $sender = new email_sender();
        $html = $sender->get_template('grade_received', [
            'fullname' => fullname($user),
            'itemname' => $gradeitem->itemname ?: $course->fullname,
            'coursename' => $course->fullname,
            'grade' => round($grade->finalgrade, 1) . '/' . round($gradeitem->grademax, 1),
            'gradeurl' => (new \moodle_url('/grade/report/user/index.php', ['id' => $course->id]))->out(),
        ]);
        
        $sender->send(
            $user->email,
            fullname($user),
            "Grade Posted: {$gradeitem->itemname}",
            $html
        );
    }
    
    public static function course_completed(\core\event\course_completed $event) {
        global $DB;
        
        $user = $DB->get_record('user', ['id' => $event->relateduserid]);
        $course = get_course($event->courseid);
        
        $sender = new email_sender();
        $html = $sender->get_template('course_completed', [
            'fullname' => fullname($user),
            'coursename' => $course->fullname,
            'certificate_link' => '', // Add certificate logic if needed
        ]);
        
        $sender->send(
            $user->email,
            fullname($user),
            "Congratulations! Course Completed: {$course->fullname}",
            $html
        );
    }
}
```

### 6. Settings Page

```php
<?php
// local/adsmedia/settings.php

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_adsmedia', get_string('pluginname', 'local_adsmedia'));
    
    $settings->add(new admin_setting_configtext(
        'local_adsmedia/api_key',
        get_string('apikey', 'local_adsmedia'),
        get_string('apikey_desc', 'local_adsmedia'),
        ''
    ));
    
    $settings->add(new admin_setting_configtext(
        'local_adsmedia/from_name',
        get_string('fromname', 'local_adsmedia'),
        get_string('fromname_desc', 'local_adsmedia'),
        ''
    ));
    
    $ADMIN->add('localplugins', $settings);
}
```

### 7. Language Strings

```php
<?php
// local/adsmedia/lang/en/local_adsmedia.php

$string['pluginname'] = 'ADSMedia Email';
$string['apikey'] = 'API Key';
$string['apikey_desc'] = 'Your ADSMedia API key';
$string['fromname'] = 'From Name';
$string['fromname_desc'] = 'The sender name for emails';
```

## Installation

1. Copy plugin to `local/adsmedia/`
2. Visit Site administration → Notifications
3. Configure API key in Site administration → Plugins → Local plugins → ADSMedia Email

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Moodle](https://moodle.org)
- [Moodle Plugins](https://moodle.org/plugins)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

