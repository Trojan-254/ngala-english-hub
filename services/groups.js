// Students who sign up without a teacher's class code.
// Kept out of teacher dashboards so a teacher only sees learners who joined their class.
const INDEPENDENT_GROUP = 'Independent';

// SQL fragment for queries aliased with `u` for users.
const EXCLUDE_INDEPENDENT = `AND COALESCE(u.class_group, '') <> '${INDEPENDENT_GROUP}'`;

module.exports = { INDEPENDENT_GROUP, EXCLUDE_INDEPENDENT };
