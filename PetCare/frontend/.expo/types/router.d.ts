declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/` | `/(tabs)/account` | `/(tabs)/adoption` | `/(tabs)/missing_pets` | `/(tabs)/nearby` | `/_sitemap` | `/account` | `/account/edit_account` | `/adoption` | `/articles/addArticle` | `/articles/browseAll` | `/articles/browsePosted` | `/articles/editArticle` | `/articles/getSelectedArticle` | `/auth/create_new_password` | `/auth/login` | `/chatbot/chatbot` | `/auth/register` | `/auth/reset_password` | `/auth/reset_password_email` | `/missing_pet/addMissingPet` | `/missing_pet/getSelectedMissingPet` | `/missing_pet/reportSighting` | `/missing_pets` | `/nearby` | `/pet_information/add_pet_form` | `/pet_information/edit_pet_form` | `/pet_information/pet_info_modal/`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }}