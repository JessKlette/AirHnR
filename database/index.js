const config = require('../config');
const knex = require('knex')({
  client: 'pg',
  connection: config.database_url
});
const bookshelf = require('bookshelf')(knex);

const getListingsNear = (lat, long, startDate, endDate, radius = 4000, limit = 25) => {
  //lat, long of center of map, and distance radius in meters
  //returns a promise of data
  let query = `
    SELECT list.*, loc.*,
    (SELECT AVG(rev.stars) average_stars FROM location_reviews rev WHERE rev.location_id = loc.id),
    (SELECT COUNT(rev.*) review_count FROM location_reviews rev WHERE rev.location_id = loc.id)
    FROM locations loc, listings list WHERE loc.id = list.location_id
    AND ST_Distance(ST_SetSRID(ST_MakePoint(${long}, ${lat})::geography, 4326), 
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) <= ${radius}
    AND '${startDate}' BETWEEN list.start_date AND list.end_date
    AND '${endDate}' BETWEEN list.start_date AND list.end_date
    AND NOT EXISTS (
      SELECT * FROM bookings WHERE bookings.listing_id = list.id
      AND bookings.start_date BETWEEN '${startDate}' AND '${endDate}'
      AND bookings.end_date BETWEEN '${startDate}' AND '${endDate}'
    )
    ORDER BY average_stars DESC LIMIT ${limit}
  `;
  return bookshelf.knex.raw(query).then(res => res.rows);
};

const getLocationsNear = (lat, long, radius = 4000) => {
  //lat, long of center of map, and distance radius in meters
  //returns a promise of data
  let query = `SELECT * FROM locations WHERE ST_Distance(ST_SetSRID(ST_MakePoint(${long}, ${lat})::geography, 4326), ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) <= ${radius}`;
  return bookshelf.knex.raw(query).then(res => res.rows);
};

const getListingInfo = (listingId) => {
  let query = `  SELECT listings.*, locations.*, u.first_name, u.avatar_url, u.address_city AS user_address_city, u.address_region AS user_address_region, u.account_created, (SELECT AVG(rev.stars) average_stars FROM location_reviews rev WHERE rev.location_id = locations.id),
  (SELECT COUNT(rev.*) review_count FROM location_reviews rev WHERE rev.location_id = locations.id)
  FROM listings, locations, location_reviews, users u WHERE listings.id=${listingId} 
  AND locations.id=listings.location_id AND u.id=listings.host_id`;
  return bookshelf.knex.raw(query).then(res => res.rows[0]);
};

const saveUserInDB = (user) => {
  return knex('users').insert(user);
}

const saveBookingInDB = (booking) => {
  return knex.insert(booking).into("bookings").then(function (result) {
    return result;
  });
}

const getUserFromDB = (userEmail) => {
  return knex('users')
  .where({ email: userEmail})
  .then((rows) => {
    return rows[0];
  });
}

const getAverageStars = () => {

}

const getBookingsByUserId = (userId) => {
  return knex.select('locations.image_url', 'bookings.num_guests', 'users.avatar_url', 'locations.address_city', 'bookings.start_date', 'bookings.end_date', 'locations.name').from('bookings')
  .innerJoin('locations', 'locations.id', 'bookings.location_id')
  .innerJoin('users', 'users.id', 'locations.host_id')
  .where('guest_id', userId);
}

module.exports = {
  getListingsNear: getListingsNear,
  getLocationsNear: getLocationsNear,
  getListingInfo: getListingInfo,
  saveUserInDB: saveUserInDB,
  getUserFromDB: getUserFromDB,
  saveBookingInDB: saveBookingInDB,
  getBookingsByUserId: getBookingsByUserId
};