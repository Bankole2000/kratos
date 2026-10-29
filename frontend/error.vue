<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message: string } }>()

const is404 = computed(() => props.error.statusCode === 404)

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <v-app>
    <v-main>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center" class="fill-height text-center">
          <v-col cols="12" sm="8" md="6">
            <div class="position-relative d-inline-block mb-6">
              <span
                class="font-weight-black text-primary"
                style="font-size: clamp(6rem, 20vw, 12rem); line-height: 1; opacity: 0.12;"
              >
                {{ error.statusCode }}
              </span>
              <div
                class="position-absolute w-100 d-flex align-center justify-center"
                style="top: 50%; transform: translateY(-50%);"
              >
                <v-icon
                  :icon="is404 ? 'mdi-map-search-outline' : 'mdi-alert-circle-outline'"
                  size="72"
                  color="primary"
                />
              </div>
            </div>

            <h1 class="text-h4 font-weight-bold mb-3">
              {{ is404 ? 'Page not found' : 'Something went wrong' }}
            </h1>

            <p class="text-body-1 text-medium-emphasis mb-8 mx-auto" style="max-width: 380px;">
              {{ is404
                ? "The page you're looking for doesn't exist or has been moved."
                : error.message || 'An unexpected error occurred. Please try again.' }}
            </p>

            <div class="d-flex gap-3 justify-center flex-wrap">
              <v-btn color="primary" size="large" prepend-icon="mdi-home-outline" @click="handleError">
                Go home
              </v-btn>
              <v-btn variant="tonal" size="large" prepend-icon="mdi-arrow-left" @click="$router.back()">
                Go back
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
