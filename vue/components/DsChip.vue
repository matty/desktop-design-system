<script setup lang="ts">
withDefaults(defineProps<{ removable?: boolean }>(), { removable: false });
const emit = defineEmits<{ remove: [] }>();
</script>
<template>
  <span class="ds-chip"><slot /><span v-if="removable" class="ds-chip-x" @click="emit('remove')">×</span></span>
</template>
