/**
 * GraphQL schema for the country master data API.
 * `JSON` is a custom scalar (via graphql-type-json) used for the free-form
 * `locales` map, since its shape varies per language code.
 */
export const typeDefs = `#graphql
  scalar JSON

  type Country {
    id: String!
    countryCode: String!
    countryCode3: String
    numericCode: String
    countryName: String
    dialingCode: String
    currencyCode: String
    currencySymbol: String
    currencyName: String
    defaultLocale: String
    numberFormat: String
    dateFormat: String
    timeZone: String
    legalRegime: String
    region: String
    isActive: Boolean
    locales: JSON
  }

  input CountryUpdateInput {
    countryName: String
    dialingCode: String
    currencyCode: String
    currencySymbol: String
    currencyName: String
    defaultLocale: String
    numberFormat: String
    dateFormat: String
    legalRegime: String
    region: String
    isActive: Boolean
  }

  type Query {
    getAllCountries: [Country!]!
    getAllCountriesByLocale(languageCode: String!): [Country!]!
    getCountryLocalesByCountryCode(countryCode: String!): Country
  }

  type Mutation {
    updateCountry(countryCode: String!, updates: CountryUpdateInput!): Country
  }
`;
