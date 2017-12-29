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
</div>
