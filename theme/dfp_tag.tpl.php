<?php
  /**
   * @file
   * Default template for dfp tags.
   */
?>

<div <?php print drupal_attributes($placeholder_attributes) ?>>
  <?php if (isset($slug)):
    print drupal_render($slug);
  endif; ?>
  <script type="text/javascript">
    <?php if (!empty($tag->disable_initial_load)): ?>
    // MIA
    <?php else: ?>
    jQuery(document).ready(function() {
      googletag.cmd.push(function() {
        googletag.display("<?php print $tag->placeholder_id ?>");
      });
    });
    <?php endif; ?>
  </script>
</div>
