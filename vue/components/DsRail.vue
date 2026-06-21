<script setup lang="ts">
import { useSlots } from "vue";
const slots = useSlots();
</script>
<template>
  <nav class="ds-rail">
    <slot />
    <template v-if="slots.bottom">
      <div class="ds-rail-spacer"></div>
      <slot name="bottom" />
    </template>
  </nav>
</template>
