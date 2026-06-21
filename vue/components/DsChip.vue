<script setup lang="ts">
withDefaults(defineProps<{ removable?: boolean }>(), { removable: false });
const emit = defineEmits<{ remove: [] }>();
</script>
<template>
  <span class="ds-chip"><slot /><button v-if="removable" type="button" class="ds-chip-x" aria-label="Remove" @click="emit('remove')">×</button></span>
</template>
