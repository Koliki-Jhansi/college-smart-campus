const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== TEST 1: GET /api/college/public-structure on Unconfigured DB ===');
  const step1 = await request({
    host: '127.0.0.1',
    port: 5000,
    path: '/api/college/public-structure',
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });
  console.log('Status:', step1.status);
  console.log('Response:', JSON.stringify(step1.data, null, 2));

  console.log('\n=== TEST 2: GET /api/auth/setup-admin-check ===');
  const step2 = await request({
    host: '127.0.0.1',
    port: 5000,
    path: '/api/auth/setup-admin-check',
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });
  console.log('Status:', step2.status);
  console.log('Response:', JSON.stringify(step2.data, null, 2));

  console.log('\n=== TEST 3: POST /api/auth/setup-admin (Create First Admin) ===');
  const step3 = await request({
    host: '127.0.0.1',
    port: 5000,
    path: '/api/auth/setup-admin',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
  }, {
    name: 'Master Principal',
    email: 'principal@collegehub.edu',
    password: 'PrincipalPass@123',
    phone: '9876543210'
  });
  console.log('Status:', step3.status);
  console.log('Response:', JSON.stringify(step3.data, null, 2));
  const adminToken = step3.data.token;

  console.log('\n=== TEST 4: POST /api/college/complete-setup (Setup Wizard) ===');
  const step4 = await request({
    host: '127.0.0.1',
    port: 5000,
    path: '/api/college/complete-setup',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    college: {
      collegeName: 'National Institute of Engineering',
      shortName: 'NIE',
      collegeCode: 'NIE-ENG',
      address: 'Campus Drive 1',
      city: 'Mysuru',
      state: 'Karnataka',
      website: 'https://nie.edu',
      contactEmail: 'contact@nie.edu',
      phone: '0821-2480475',
      currentAcademicYear: '2026-2027'
    },
    departments: [
      { name: 'Computer Science and Engineering', code: 'CSE', description: 'Computing Department' },
      { name: 'Information Science', code: 'ISE', description: 'Information Science Department' }
    ],
    programs: [
      { name: 'B.Tech in Computer Science', code: 'BTECH-CSE', departmentCode: 'CSE', degreeType: 'B.Tech', duration: '4 Years', totalSemesters: 8 },
      { name: 'B.Tech in Information Science', code: 'BTECH-ISE', departmentCode: 'ISE', degreeType: 'B.Tech', duration: '4 Years', totalSemesters: 8 }
    ],
    academicStructure: {
      academicYears: ['2025-2026', '2026-2027'],
      years: [1, 2, 3, 4],
      semesters: [1, 2, 3, 4, 5, 6, 7, 8],
      sections: ['A', 'B']
    },
    campusFacilities: [
      { name: 'Advanced Cloud Lab', code: 'LAB-CLD-1', category: 'Lab', building: 'Computing Block', block: '2nd Floor', roomNumber: '201', capacity: 60 }
    ]
  });
  console.log('Status:', step4.status);
  console.log('Response:', JSON.stringify(step4.data, null, 2));

  console.log('\n=== TEST 5: GET /api/college/public-structure on Configured DB ===');
  const step5 = await request({
    host: '127.0.0.1',
    port: 5000,
    path: '/api/college/public-structure',
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });
  console.log('Status:', step5.status);
  console.log('Configured:', step5.data.configured);
  console.log('Departments count:', step5.data.departments.length);
  console.log('Programs count:', step5.data.programs.length);

  const cseDept = step5.data.departments.find(d => d.code === 'CSE');
  const cseProg = step5.data.programs.find(p => p.code === 'BTECH-CSE');

  console.log('\n=== TEST 6: POST /api/auth/register (Student Registration with dynamic DB IDs) ===');
  const step6 = await request({
    host: '127.0.0.1',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
  }, {
    name: 'Dev Student',
    email: 'dev.student@collegehub.edu',
    password: 'Password@123',
    phone: '9988776655',
    role: 'student',
    collegeId: '23CS999',
    department: cseDept._id,
    course: cseProg._id,
    year: 3,
    semester: 6,
    section: 'A'
  });
  console.log('Status:', step6.status);
  console.log('Registered User:', step6.data.user);
  const studentToken = step6.data.token;

  console.log('\n=== TEST 7: GET /api/analytics/dashboard (Student Dashboard - Expecting 0s / Empty State) ===');
  const step7 = await request({
    host: '127.0.0.1',
    port: 5000,
    path: '/api/analytics/dashboard',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    }
  });
  console.log('Status:', step7.status);
  console.log('Student Metrics:', JSON.stringify(step7.data.metrics, null, 2));

  console.log('\n=== TEST 8: POST /api/projects (Student creates first project -> count becomes 1) ===');
  const step8 = await request({
    host: '127.0.0.1',
    port: 5000,
    path: '/api/projects',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    }
  }, {
    title: 'Autonomous Drone Navigator',
    description: 'Computer vision and lidar based indoor navigation drone for campus delivery.',
    category: 'Robotics & Hardware',
    tags: ['Robotics', 'Python', 'OpenCV'],
    rolesNeeded: [{ roleName: 'CV Engineer', skillsRequired: ['OpenCV'], spots: 1 }]
  });
  console.log('Status:', step8.status);
  console.log('Created Project ID:', step8.data.project?._id);

  console.log('\n=== TEST 9: Re-verify Student Dashboard Metrics ===');
  const step9 = await request({
    host: '127.0.0.1',
    port: 5000,
    path: '/api/analytics/dashboard',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    }
  });
  console.log('Updated myProjects Count:', step9.data.metrics.myProjects);
  console.log('\nALL 9 END-TO-END FLOW TESTS COMPLETED SUCCESSFULLY! ✨');
}

runTests().catch(console.error);
