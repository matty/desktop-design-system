<script setup lang="ts"></script>
<template>
  <div class="ds-statusbar">
    <slot name="start" />
    <div class="ds-statusbar-spacer"></div>
    <slot name="end" />
  </div>
</template>
