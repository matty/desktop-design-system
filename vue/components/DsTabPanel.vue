<script setup lang="ts">
import { inject, computed, type ComputedRef } from "vue";

const props = defineProps<{ id: string }>();
const active = inject<ComputedRef<string>>("dsActiveTab");
const show = computed(() => active?.value === props.id);
</script>

<template>
  <div v-if="show" role="tabpanel">
    <slot />
  </div>
</template>
