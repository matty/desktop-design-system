<script setup lang="ts">
import { computed } from "vue";
// @ts-expect-error — icons.js has no type declarations
import { iconSvg } from "../../icons/icons.js";
import registry from "../../icons/registry.json";

const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 16 });

const svg = computed(() => {
  if (!(registry as { icons: Record<string, unknown> }).icons[props.name]) return "";
  return iconSvg(props.name, registry, { width: props.size, height: props.size });
});
</script>

<template>
  <span aria-hidden="true" v-html="svg"></span>
</template>
