import GraphQLJSON from "graphql-type-json";
import {
  getAllCountries,
  getAllCountriesByLocale,
  getCountryLocalesByCountryCode,
  updateCountry,
} from "../services/countryMasterService.js";

/**
 * Root resolver map for the country master data schema.
 */
export const resolvers = {
  JSON: GraphQLJSON,

  Query: {
    getAllCountries: async () => getAllCountries(),

    getAllCountriesByLocale: async (_parent, { languageCode }) => getAllCountriesByLocale(languageCode),

    getCountryLocalesByCountryCode: async (_parent, { countryCode }) =>
      getCountryLocalesByCountryCode(countryCode),
  },

  Mutation: {
    updateCountry: async (_parent, { countryCode, updates }) => updateCountry(countryCode, updates),
  },
};
