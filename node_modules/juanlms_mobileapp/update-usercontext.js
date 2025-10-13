// Script to help update UserContext imports to useUserState
// This is a helper script - you can run it to see which files need updating

const fs = require('fs');
const path = require('path');

// List of files that need UserContext import updates
const filesToUpdate = [
  'frontend/components/VPE/VPEMeeting.js',
  'frontend/components/Students/StudentMeeting.js',
  'frontend/components/Principal/PrincipalMeeting.js',
  'frontend/components/Faculty/FacultyMeeting.js',
  'frontend/components/Students/StudentModule.js',
  'frontend/components/Students/StudentClasses.js',
  'frontend/components/Students/StudentsProfile.js',
  'frontend/components/Faculty/FacultyProfile.js',
  'frontend/components/VPE/VPEProfile.js',
  'frontend/components/VPE/VPEDashboard.js',
  'frontend/components/VPE/VPECalendar.js',
  'frontend/components/UnifiedChat.js',
  'frontend/components/Students/StudentSupportCenter.js',
  'frontend/components/Students/StudentsCalendar.js',
  'frontend/components/Students/StudentSCMain.js',
  'frontend/components/Students/StudentGrades.js',
  'frontend/components/Students/StudentActs.js',
  'frontend/components/Students/QuizView.js',
  'frontend/components/Students/AssignmentDetail.js',
  'frontend/components/Principal/PrincipalProfile.js',
  'frontend/components/Principal/PrincipalDashboard.js',
  'frontend/components/Faculty/FacultySupportCenter.js',
  'frontend/components/Faculty/FacultyStudentProgress.js',
  'frontend/components/Faculty/FacultySCMain.js',
  'frontend/components/Faculty/FacultyModule.js',
  'frontend/components/Faculty/FacultyCalendar.js',
  'frontend/components/Faculty/FacultyClasses.js',
  'frontend/components/Faculty/FacultyActs.js',
  'frontend/components/Faculty/CreateQuiz.js',
  'frontend/components/Chat.js',
  'frontend/components/Faculty/ConfirmClasses.js',
  'frontend/components/Faculty/ClassConfirmationModal.js',
  'frontend/components/Admin/AdminProfile.js',
  'frontend/components/Admin/AdminDashboard.js',
  'frontend/components/Admin/AdminChats.js',
  'frontend/components/Principal/PrincipalCalendar.js',
  'frontend/components/GroupChat.js',
  'frontend/components/GroupManagement.js',
  'frontend/components/Faculty/CreateClasses.js',
  'frontend/components/Faculty/CreateAssignment.js',
  'frontend/components/Admin/AdminCalendar.js'
];

console.log('Files that need UserContext import updates:');
filesToUpdate.forEach(file => {
  console.log(`- ${file}`);
});

console.log('\nTo update each file, replace:');
console.log('import { useUser } from \'../UserContext\';');
console.log('with:');
console.log('import { useUserState } from \'../../hooks/useUserState\';');
console.log('\nAnd replace:');
console.log('const { user } = useUser();');
console.log('with:');
console.log('const { user } = useUserState();');
