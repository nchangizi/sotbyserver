const { Pool } = require("pg");

/*
package needed to read .env which is
not on github repo to read pool info
*/
require('dotenv').config();

const pool = new Pool({
  host: process.env.HOST,
  user: process.env.DB_USER,
  port: process.env.PORT,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  // ssl: { rejectUnauthorized: false }
});

pool.connect();

const getUsers = (year) => {
  return new Promise(function (resolve, reject) {
    pool.query(`SELECT u.username, u.first_name, u.last_name, u.row_num, c.course_num, ca.ca_id, ca.start_date, ca.end_date, c.title, c.colour, v.start_date as vacation_start, v.end_date as vacation_end, v.vacation_id, v.approved from "user" u
                  LEFT JOIN course_assignment ca ON u.username = ca.username
                  LEFT JOIN course c ON ca.course_num = c.course_num
                  LEFT JOIN vacation v ON v.username = u.username
                  ORDER BY u.row_num`
      , (error, results) => {
        if (error || !results) {
          reject(error)
        }
        resolve(results.rows);
      })
  });
}

const getCourses = () => {
  return new Promise(function (resolve, reject) {
    pool.query(`SELECT c.course_num, c.title from "course" c`
      , (error, results) => {
        if (error || !results) {
          reject(error)
        }
        resolve(results.rows);
      })
  });
}

const postUser = (user) => {
  console.log(user.datejoined);
  return new Promise(function (resolve, reject) {
    pool.query(`INSERT INTO "user"
            (username, first_name, last_name, date_joined, admin, email, password)
            VALUES 
            ('${user.username}', '${user.firstname}', '${user.lastname}', 
            TO_DATE('${user.datejoined}', 'YYYY-MM-DD'), '${user.admin}', '${user.email}', 
            '${user.password}')`
      , (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results);
      })
  });
}

const postAdmin = (user) => {
  return new Promise(function (resolve, reject) {
    pool.query(`INSERT INTO "user"
            (username, first_name, last_name, date_joined, admin, email, password)
            VALUES 
            ('${user.username}', '${user.firstname}', '${user.lastname}', 
            to_timestamp(${user.datejoined} / 1000.0), '${1}', '${user.email}', 
            '${user.password}')`
      , (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results);
      })
  });
}

const postResource = (resource) => {
  return new Promise(function (resolve, reject) {
    pool.query(`INSERT INTO "resource"
            (model_num, model_name, quantity_total, model_location)
            VALUES 
            ('${resource.model_num}', '${resource.model_name}', '${parseInt(resource.quantity_total)}', '${resource.model_location}')`
      , (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results);
      })
  });
}

const postCourse1 = (course) => {
  return new Promise(function (resolve, reject) {
    console.log(course);
    console.log(course.course_num);
    pool.query(`INSERT INTO "course"
            (course_num, subject, course, title, start_date, end_date, colour)
            VALUES 
            (${parseInt(course.course_num)}, '${course.subject}', ${parseInt(course.course)}, '${course.title}', 
            '${course.start_date}', '${course.end_date}', '${course.colour}')`
      , (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results);
      })
  });
}

// **PREVIOUS COURSE ASSIGNMENT**
const postCourseAssignment = (course) => {
  return new Promise(function (resolve, reject) {
    pool.query(`
            INSERT INTO "course_assignment"
            (username, course_num, start_date, end_date)
            VALUES
            ('${course.instructorKey}', ${course.number}, 
            to_timestamp(${course.start} / 1000.0), to_timestamp(${course.end} / 1000.0))
            RETURNING ca_id;
            `
      , (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results.rows[0].ca_id);
      })
  });
}

const putCourse = (username, id, start, end) => {
  return new Promise(function (resolve, reject) {
    pool.query(`UPDATE "course_assignment" 
    SET start_date = (to_timestamp(${start} / 1000.0)), end_date = (to_timestamp(${end} / 1000.0)) 
    WHERE ca_id = ${id}`,
      (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results)
      })
  });
}

const getUser = (username) => {
  return new Promise(function (resolve, reject) {
    pool.query(`SELECT u.username from "user" u
                WHERE u.username = '${username}'
                `
      , (error, results) => {
        if (error) {
          reject(error)
        }
        if (results.rows == 0) {
          reject("User doesn't exist");
        } else {
          resolve(results.rows);
        }
      })
  });
}

const deleteUser = (id) => {
  return new Promise(function (resolve, reject) {
    pool.query(`
                DELETE from "user" u
                WHERE u.username = '${id}';
                `,
      (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results)
      })
  });
}

const deleteCourse = (courseId) => {
  return new Promise(function (resolve, reject) {
    pool.query(`
                DELETE FROM "course_assignment" ca
                WHERE ca.ca_id = ${courseId} 
                `,
      (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results)
      })
  });
}

const getVacationsApproved = () => {
  return new Promise(function (resolve, reject) {
    pool.query(`SELECT v.username, v.start_date, v.end_date, v.duration from "vacation" v
                  WHERE v.approved = 1`
      , (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results.rows);
      })
  });
}

const getAllVacationsNotApproved = () => {
  return new Promise(function (resolve, reject) {
    pool.query(`SELECT v.vacation_id, v.username, v.start_date, v.end_date, v.duration from "vacation" v
                  WHERE v.approved = 0`
      , (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results.rows);
      })
  });
}

const approveVacation = (vacation) => {
  console.log("request approve vacation")
  return new Promise(function (resolve, reject) {
    pool.query(`UPDATE "vacation"
    SET approved = 1
    WHERE vacation_id = '${vacation.vacation_id}'`,
      (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results)
      })
  });
}

const postVacation = (vacation) => {
  return new Promise(function (resolve, reject) {
    pool.query(`INSERT INTO "vacation" 
                  (username, start_date, end_date, duration, approved)
                  VALUES
                  ('${vacation.username}', to_timestamp(${vacation.start_date} / 1000),to_timestamp(${vacation.end_date} / 1000),'${vacation.duration}', 0)`
      , (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results);
      })
  });
}

const deleteVacation = (vacation) => {
  return new Promise(function (resolve, reject) {
    pool.query(`DELETE FROM "vacation" v
                WHERE v.vacation_id = '${vacation.vacation_id}'`,
      (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results)
      })
  });
}

// Login
const login = (user) => {
  return new Promise(function (resolve, reject) {
    pool.query(`SELECT username, first_name, last_name, admin, password FROM "user" WHERE username = '${user.username}'`,
      (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results);
      })
  });
}

const getCourseDetail = (course_num) => {
  return new Promise(function (resolve, reject) {
    pool.query(`SELECT daily_schedule.ds_id, course_assignment.ca_id, date, description, course_assignment.username, subject, course, resource.model_num, model_name, SUM(quantity) as quantity 
                FROM daily_schedule
                INNER JOIN course ON course.course_num=daily_schedule.course_num
                LEFT JOIN course_assignment ON course_assignment.course_num=course.course_num AND daily_schedule.date BETWEEN course_assignment.start_date AND course_assignment.end_date
                LEFT JOIN resource_allocation ON resource_allocation.ds_id=daily_schedule.ds_id
                LEFT JOIN resource ON resource_allocation.model_num=resource.model_num
                WHERE course.course_num=${course_num}
                GROUP BY (daily_schedule.ds_id, course_assignment.ca_id, date, description, course_assignment.username, subject, course, resource.model_num, model_name)
                ORDER BY date;`,
      (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results)
      })
  });
}

const getResources = (date) => {
  console.log(date);
  return new Promise(function (resolve, reject) {
    pool.query(`SELECT resource.model_num, model_name, quantity_total, model_location, (quantity_total - quantity) AS q_left
                FROM "resource"
                LEFT JOIN
                (SELECT model_num, SUM(quantity) AS quantity FROM "resource_allocation"
                INNER JOIN "daily_schedule" ON daily_schedule.ds_id=resource_allocation.ds_id
                WHERE date='${date}'
                GROUP BY model_num) res_allocated_for_day 
                ON (res_allocated_for_day.model_num = resource.model_num);`,
      (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results)
      })
  });
}

const updateCourseDetailDay = (rowInfo) => {
  return new Promise(function (resolve, reject) {
    pool.query(`UPDATE "daily_schedule"
                SET description='${rowInfo.description}'
                WHERE ds_id=${rowInfo.ds_id};`,
      (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results)
      })
  });
}

const bookResource = (bookingInfo) => {
  return new Promise(function (resolve, reject) {
    pool.query(`INSERT INTO "resource_allocation"
                (ds_id, model_num, quantity)
                VALUES 
                (${bookingInfo.ds_id}, '${bookingInfo.model_num}', ${bookingInfo.quantity_booked})`,
      (error, results) => {
        if (error) {
          reject(error)
        }
        resolve(results)
      })
  });
}

module.exports = {
  getUsers,
  postUser,
  deleteUser,
  postCourseAssignment,
  postResource,
  postCourse1,
  putCourse,
  deleteCourse,
  getUser,
  getVacationsApproved,
  getAllVacationsNotApproved,
  approveVacation,
  postVacation,
  deleteVacation,
  getCourseDetail,
  getResources,
  updateCourseDetailDay,
  bookResource,
  login,
  getCourses,
  postAdmin
}