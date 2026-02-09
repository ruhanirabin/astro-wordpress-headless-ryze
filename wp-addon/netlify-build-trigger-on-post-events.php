<?php
/**
 * Netlify Build Trigger on Post Events
 *
 * Triggers a Netlify build webhook when posts are saved, deleted, or published.
 * Prevents duplicate triggers within the same request. Install this snippet in your 
 * WordPress site to automatically rebuild your Netlify site whenever content changes.
 * Use: WPCodeBox, Fluent Snippets, or similar plugin to add this code.
 *
 * @package     WordPress
 * @subpackage  Code Snippets
 * @author      Ruhani Rabin
 * @link        https://www.ruhanirabin.com/code-snippet/
 * @version     1.1.0
 *
 * Changelog:
 * 1.1.0 - 2025-02-01
 * - Moved webhook URL to a constant for easy configuration across sites
 * 
 * 1.0.0 - 2025-02-01
 * - Initial release
 * - Added support for post save, delete, and publish events
 * - Implemented duplicate trigger prevention
 * - Added error logging for failed webhook calls
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Configuration
 * 
 * Set your Netlify build hook URL here
 * To get your build hook URL:
 * 1. Go to your Netlify site dashboard
 * 2. Navigate to Site settings > Build & deploy > Build hooks
 * 3. Create a new build hook and copy the URL
 */
define('NETLIFY_BUILD_HOOK_URL', 'https://api.netlify.com/build_hooks/CHANGE_THIS_TO_YOUR_HOOK_ID');

class Netlify_Build_Trigger {
    
    /**
     * Flag to prevent duplicate triggers in the same request
     *
     * @var bool
     */
    private static $triggered = false;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->init_hooks();
    }
    
    /**
     * Initialize WordPress hooks
     */
    private function init_hooks() {
        // Trigger on post save/update
        add_action('save_post', array($this, 'trigger_on_save'), 10, 3);
        
        // Trigger on post delete
        add_action('delete_post', array($this, 'trigger_on_delete'), 10, 2);
        
        // Trigger on post publish (transition from any status to publish)
        add_action('transition_post_status', array($this, 'trigger_on_publish'), 10, 3);
    }
    
    /**
     * Trigger webhook on post save
     *
     * @param int     $post_id Post ID
     * @param WP_Post $post    Post object
     * @param bool    $update  Whether this is an existing post being updated
     */
    public function trigger_on_save($post_id, $post, $update) {
        // Prevent duplicate triggers
        if (self::$triggered) {
            return;
        }
        
        // Skip autosaves and revisions
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        
        if (wp_is_post_revision($post_id)) {
            return;
        }
        
        // Only trigger for posts (you can add more post types if needed)
        if ($post->post_type !== 'post') {
            return;
        }
        
        // Only trigger on manual saves (not auto-drafts)
        if ($post->post_status === 'auto-draft') {
            return;
        }
        
        $this->send_webhook('Post saved: ' . $post->post_title);
    }
    
    /**
     * Trigger webhook on post delete
     *
     * @param int     $post_id Post ID
     * @param WP_Post $post    Post object
     */
    public function trigger_on_delete($post_id, $post) {
        // Prevent duplicate triggers
        if (self::$triggered) {
            return;
        }
        
        // Only trigger for posts
        if ($post->post_type !== 'post') {
            return;
        }
        
        $this->send_webhook('Post deleted: ' . $post->post_title);
    }
    
    /**
     * Trigger webhook on post publish
     *
     * @param string  $new_status New post status
     * @param string  $old_status Old post status
     * @param WP_Post $post       Post object
     */
    public function trigger_on_publish($new_status, $old_status, $post) {
        // Prevent duplicate triggers
        if (self::$triggered) {
            return;
        }
        
        // Only trigger when transitioning TO publish status
        if ($new_status !== 'publish') {
            return;
        }
        
        // Skip if already published (handled by save_post)
        if ($old_status === 'publish') {
            return;
        }
        
        // Only trigger for posts
        if ($post->post_type !== 'post') {
            return;
        }
        
        $this->send_webhook('Post published: ' . $post->post_title);
    }
    
    /**
     * Send webhook to Netlify
     *
     * @param string $action Description of the action triggering the build
     */
    private function send_webhook($action = '') {
        // Set the triggered flag to prevent duplicates
        self::$triggered = true;
        
        $response = wp_remote_post(NETLIFY_BUILD_HOOK_URL, array(
            'method'      => 'POST',
            'timeout'     => 15,
            'blocking'    => false, // Non-blocking to avoid slowing down WordPress
            'headers'     => array(
                'Content-Type' => 'application/json',
            ),
            'body'        => json_encode(array()),
        ));
        
        // Log errors (optional - can be viewed in debug.log if WP_DEBUG_LOG is enabled)
        if (is_wp_error($response)) {
            error_log('Netlify Build Trigger Error: ' . $response->get_error_message());
        } else {
            error_log('Netlify Build Triggered: ' . $action);
        }
    }
}

// Initialize the class
new Netlify_Build_Trigger();