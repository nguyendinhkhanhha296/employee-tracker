const connection = require('./config/connection');
const inquirer = require('inquirer');
const validate = require('./validator/validator');
require('console.table');

// connect to the m query server and query database
connection.connect(function (error) {
    if (error) throw error;
    // run the start function after the connection is made to prompt the user
    promptUser();
});

// Prompt User for Choices
const promptUser = () => {
    inquirer.prompt([{
            name: 'choices',
            type: 'list',
            message: 'What would you like to do?',
            choices: [
                'View All Employees',
                'View All Roles',
                'View All Departments',
                'View All Employees By Department',
                'View Department Budgets',
                'Update Employee Role',
                'Update Employee Manager',
                'Add Employee',
                'Add Role',
                'Add Department',
                'Remove Employee',
                'Remove Role',
                'Remove Department',
                'Quit'
            ]
        }])
        .then((answers) => {
            const {
                choices
            } = answers;

            if (choices === 'View All Employees') {
                viewAllEmployees();
            }

            if (choices === 'View All Departments') {
                viewAllDepartments();
            }

            if (choices === 'View All Roles') {
                viewAllRoles();
            }

            if (choices === 'View All Employees By Department') {
                viewEmployeesByDepartment();
            }

            if (choices === 'View Department Budgets') {
                viewDepartmentBudget();
            }

            if (choices === 'Add Employee') {
                addEmployee();
            }

            if (choices === 'Remove Employee') {
                removeEmployee();
            }

            if (choices === 'Add Role') {
                addRole();
            }

            if (choices === 'Remove Role') {
                removeRole();
            }

            if (choices === 'Add Department') {
                addDepartment();
            }

            if (choices === 'Remove Department') {
                removeDepartment();
            }

            if (choices === 'Update Employee Role') {
                updateEmployeeRole();
            }

            if (choices === 'Update Employee Manager') {
                updateEmployeeManager();
            }

            if (choices === 'Quit') {
                connection.end();
            }
        });
};

//========================================VIEW=========================================
//1. View All Employees
const viewAllEmployees = () => {
    let query = `SELECT employee.id, 
                    employee.first_name, 
                    employee.last_name, 
                    role.title, 
                    department.department_name AS 'department', 
                    role.salary
                 FROM employee, role, department 
                 WHERE department.id = role.department_id 
                 AND role.id = employee.role_id
                 ORDER BY employee.id ASC`;
    connection.query(query, (error, response) => {
        if (error) throw error;
        console.table(response);
        promptUser();
    });
};

//2. View all Roles
const viewAllRoles = () => {
    const query = `SELECT role.id, role.title, department.department_name AS department
                   FROM role
                   INNER JOIN department ON role.department_id = department.id`;
    connection.query(query, (error, response) => {
        if (error) throw error;
        response.forEach((role) => {
            console.log(role.title);
        });
        promptUser();
    });
};

//3. View all Departments
const viewAllDepartments = () => {
    const query = `SELECT department.id AS id, department.department_name AS department FROM department`;
    connection.query(query, (error, response) => {
        if (error) throw error;
        console.table(response);
        promptUser();
    });
};

//4. View all Employees by Department
const viewEmployeesByDepartment = () => {
    const query = `SELECT employee.first_name, 
                    employee.last_name, 
                    department.department_name AS department
                   FROM employee 
                   LEFT JOIN role ON employee.role_id = role.id 
                   LEFT JOIN department ON role.department_id = department.id`;
    connection.query(query, (error, response) => {
        if (error) throw error;
        console.table(response);
        promptUser();
    });
};

//5. View all Departments by Budget
const viewDepartmentBudget = () => {
    const query = `SELECT department_id AS id, 
                    department.department_name AS department,
                   SUM(salary) AS budget
                   FROM  role  
                   INNER JOIN department ON role.department_id = department.id GROUP BY role.department_id`;
    connection.query(query, (error, response) => {
        if (error) throw error;
        console.table(response);
        promptUser();
    });
};

//========================================ADD=========================================
//1. Add a New Employee
const addEmployee = () => {
    inquirer.prompt([{
                type: 'input',
                name: 'fistName',
                message: "What is the employee's first name?",
                validate: addFirstName => {
                    if (addFirstName) {
                        return true;
                    } else {
                        console.log('Please enter a first name');
                        return false;
                    }
                }
            },
            {
                type: 'input',
                name: 'lastName',
                message: "What is the employee's last name?",
                validate: addLastName => {
                    if (addLastName) {
                        return true;
                    } else {
                        console.log('Please enter a last name');
                        return false;
                    }
                }
            }
        ])
        .then(answer => {
            const crit = [answer.fistName, answer.lastName]
            const roleSql = `SELECT role.id, role.title FROM role`;
            connection.query(roleSql, (error, data) => {
                if (error) throw error;
                const roles = data.map(({
                    id,
                    title
                }) => ({
                    name: title,
                    value: id
                }));
                inquirer.prompt([{
                        type: 'list',
                        name: 'role',
                        message: "What is the employee's role?",
                        choices: roles
                    }])
                    .then(roleChoice => {
                        const role = roleChoice.role;
                        crit.push(role);
                        const managerSql = `SELECT * FROM employee`;
                        connection.query(managerSql, (error, data) => {
                            if (error) throw error;
                            const managers = data.map(({
                                id,
                                first_name,
                                last_name
                            }) => ({
                                name: first_name + " " + last_name,
                                value: id
                            }));
                            inquirer.prompt([{
                                    type: 'list',
                                    name: 'manager',
                                    message: "Who is the employee's manager?",
                                    choices: managers
                                }])
                                .then(managerChoice => {
                                    const manager = managerChoice.manager;
                                    crit.push(manager);
                                    const sql = `INSERT INTO employee (first_name, last_name, role_id, manager_id)
                                    VALUES (?, ?, ?, ?)`;
                                    connection.query(sql, crit, (error) => {
                                        if (error) throw error;
                                        console.log("Employee has been added!")
                                        viewAllEmployees();
                                    });
                                });
                        });
                    });
            });
        });
};

//2. Add a New Role
const addRole = () => {
    const sql = 'SELECT * FROM department'
    connection.query(sql, (error, response) => {
        if (error) throw error;
        let deptNamesArray = [];
        response.forEach((department) => {
            deptNamesArray.push(department.department_name);
        });
        deptNamesArray.push('Create Department');
        inquirer
            .prompt([{
                name: 'departmentName',
                type: 'list',
                message: 'Which department is this new role in?',
                choices: deptNamesArray
            }])
            .then((answer) => {
                if (answer.departmentName === 'Create Department') {
                    this.addDepartment();
                } else {
                    addRoleresponseume(answer);
                }
            });

        const addRoleresponseume = (departmentData) => {
            inquirer
                .prompt([{
                        name: 'newRole',
                        type: 'input',
                        message: 'What is the name of your new role?',
                        validate: validate.validateString
                    },
                    {
                        name: 'salary',
                        type: 'input',
                        message: 'What is the salary of this new role?',
                        validate: validate.validateSalary
                    }
                ])
                .then((answer) => {
                    let createdRole = answer.newRole;
                    let departmentId;

                    response.forEach((department) => {
                        if (departmentData.departmentName === department.department_name) {
                            departmentId = department.id;
                        }
                    });

                    let sql = `INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)`;
                    let crit = [createdRole, answer.salary, departmentId];

                    connection.query(sql, crit, (error) => {
                        if (error) throw error;
                        viewAllRoles();
                    });
                });
        };
    });
};

//3. Add a New Department
const addDepartment = () => {
    inquirer
        .prompt([{
            name: 'newDepartment',
            type: 'input',
            message: 'What is the name of your new Department?',
            validate: validate.validateString
        }])
        .then((answer) => {
            let sql = `INSERT INTO department (department_name) VALUES (?)`;
            connection.query(sql, answer.newDepartment, (error, _response) => {
                if (error) throw error;
                viewAllDepartments();
            });
        });
};

//========================================UPDATE=========================================
//1. Update an Employee's Role
const updateEmployeeRole = () => {
    const employeeSql = `SELECT * FROM employee`;

    connection.query(employeeSql, (err, data) => {
        if (err) throw err;

        const employees = data.map(({
            id,
            first_name,
            last_name
        }) => ({
            name: first_name + " " + last_name,
            value: id
        }));

        inquirer.prompt([{
                type: 'list',
                name: 'name',
                message: "Which employee would you like to update?",
                choices: employees
            }])
            .then(empChoice => {
                const employee = empChoice.name;
                const params = [];
                params.push(employee);

                const roleSql = `SELECT * FROM role`;

                connection.query(roleSql, (err, data) => {
                    if (err) throw err;

                    const roles = data.map(({
                        id,
                        title
                    }) => ({
                        name: title,
                        value: id
                    }));

                    inquirer.prompt([{
                            type: 'list',
                            name: 'role',
                            message: "What is the employee's new role?",
                            choices: roles
                        }])
                        .then(roleChoice => {
                            const role = roleChoice.role;
                            params.push(role);

                            let employee = params[0]
                            params[0] = role
                            params[1] = employee


                            // console.log(params)

                            const sql = `UPDATE employee SET role_id = ? WHERE id = ?`;

                            connection.query(sql, params, (err, result) => {
                                if (err) throw err;
                                console.log("Employee has been updated!");

                                viewAllEmployees();
                            });
                        });
                });
            });
    });
};

//2. Update an Employee's Manager
const updateEmployeeManager = () => {
    const employeeSql = `SELECT * FROM employee`;

    connection.query(employeeSql, (err, data) => {
        if (err) throw err;

        const employees = data.map(({
            id,
            first_name,
            last_name
        }) => ({
            name: first_name + " " + last_name,
            value: id
        }));

        inquirer.prompt([{
                type: 'list',
                name: 'name',
                message: "Which employee would you like to update?",
                choices: employees
            }])
            .then(empChoice => {
                const employee = empChoice.name;
                const params = [];
                params.push(employee);

                const managerSql = `SELECT * FROM employee`;

                connection.query(managerSql, (err, data) => {
                    if (err) throw err;

                    const managers = data.map(({
                        id,
                        first_name,
                        last_name
                    }) => ({
                        name: first_name + " " + last_name,
                        value: id
                    }));

                    inquirer.prompt([{
                            type: 'list',
                            name: 'manager',
                            message: "Who is the employee's manager?",
                            choices: managers
                        }])
                        .then(managerChoice => {
                            const manager = managerChoice.manager;
                            params.push(manager);

                            let employee = params[0]
                            params[0] = manager
                            params[1] = employee

                            const sql = `UPDATE employee SET manager_id = ? WHERE id = ?`;

                            connection.query(sql, params, (err, result) => {
                                if (err) throw err;
                                console.log("Employee has been updated!");

                                viewAllEmployees();
                            });
                        });
                });
            });
    });
};

// -------------------------------------- REMOVE --------------------------------------------------------
//1. Delete an Employee
const removeEmployee = () => {
    let sql = `SELECT employee.id, employee.first_name, employee.last_name FROM employee`;

    connection.query(sql, (error, response) => {
        if (error) throw error;
        let employeeNamesArray = [];
        response.forEach((employee) => {
            employeeNamesArray.push(`${employee.first_name} ${employee.last_name}`);
        });

        inquirer
            .prompt([{
                name: 'chosenEmployee',
                type: 'list',
                message: 'Which employee would you like to remove?',
                choices: employeeNamesArray
            }])
            .then((answer) => {
                let employeeId;

                response.forEach((employee) => {
                    if (
                        answer.chosenEmployee ===
                        `${employee.first_name} ${employee.last_name}`
                    ) {
                        employeeId = employee.id;
                    }
                });

                let sql = `DELETE FROM employee WHERE employee.id = ?`;
                connection.query(sql, [employeeId], (error) => {
                    if (error) throw error;
                    console.log(`Employee Successfully Removed`);
                    viewAllEmployees();
                });
            });
    });
};

//2. Delete a Role
const removeRole = () => {
    let sql = `SELECT role.id, role.title FROM role`;

    connection.query(sql, (error, response) => {
        if (error) throw error;
        let roleNamesArray = [];
        response.forEach((role) => {
            roleNamesArray.push(role.title);
        });

        inquirer
            .prompt([{
                name: 'chosenRole',
                type: 'list',
                message: 'Which role would you like to remove?',
                choices: roleNamesArray
            }])
            .then((answer) => {
                let roleId;

                response.forEach((role) => {
                    if (answer.chosenRole === role.title) {
                        roleId = role.id;
                    }
                });

                let sql = `DELETE FROM role WHERE role.id = ?`;
                connection.query(sql, [roleId], (error) => {
                    if (error) throw error;
                    console.log(`Role Successfully Removed`);
                    viewAllRoles();
                });
            });
    });
};

//3. Delete a Department
const removeDepartment = () => {
    let sql = `SELECT department.id, department.department_name FROM department`;
    connection.query(sql, (error, response) => {
        if (error) throw error;
        let departmentNamesArray = [];
        response.forEach((department) => {
            departmentNamesArray.push(department.department_name);
        });

        inquirer
            .prompt([{
                name: 'chosenDept',
                type: 'list',
                message: 'Which department would you like to remove?',
                choices: departmentNamesArray
            }])
            .then((answer) => {
                let departmentId;

                response.forEach((department) => {
                    if (answer.chosenDept === department.department_name) {
                        departmentId = department.id;
                    }
                });

                let sql = `DELETE FROM department WHERE department.id = ?`;
                connection.query(sql, [departmentId], (error) => {
                    if (error) throw error;
                    console.log(`Department Successfully Removed`);
                    viewAllDepartments();
                });
            });
    });
};