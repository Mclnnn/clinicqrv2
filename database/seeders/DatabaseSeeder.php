<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            [
                'name'        => 'Super Admin',
                'username'    => 'superadmin',
                'email'       => 'superadmin@clinicqr.com',
                'password'    => Hash::make('superadmin123'),
                'role'        => 'Super Admin',
                'student_id'  => null,
                'employee_id' => 'EMP-001',
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
            [
                'name'        => 'Admin User',
                'username'    => 'admin',
                'email'       => 'admin@clinicqr.com',
                'password'    => Hash::make('admin123'),
                'role'        => 'Admin',
                'student_id'  => null,
                'employee_id' => 'EMP-002',
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
            [
                'name'        => 'Juan dela Cruz',
                'username'    => 'juandelacruz',
                'email'       => 'user@clinicqr.com',
                'password'    => Hash::make('user123'),
                'role'        => 'User',
                'student_id'  => 'STU-2024-001',
                'employee_id' => null,
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
        ] as $user) {
            DB::table('users')->updateOrInsert(
                ['email' => $user['email']],
                $user
            );
        }

        $medicines = [
            ['Fever / Pain', 'Paracetamol 500 mg tablet', 'Antipyretics', 'Use for fever or mild pain as directed.'],
            ['Fever / Pain', 'Paracetamol 250 mg/5 mL suspension', 'Antipyretics', 'Use for fever or mild pain as directed.'],
            ['Fever / Pain', 'Paracetamol 120 mg/5 mL syrup', 'Antipyretics', 'Use for fever or mild pain as directed.'],
            ['Fever / Pain', 'Ibuprofen 200 mg tablet', 'Anti-inflammatory Drugs', 'Use for fever, pain, or inflammation as directed.'],
            ['Fever / Pain', 'Ibuprofen 100 mg/5 mL suspension', 'Anti-inflammatory Drugs', 'Use for fever, pain, or inflammation as directed.'],
            ['Fever / Pain', 'Mefenamic Acid 250 mg capsule', 'Analgesics', 'Use for pain relief as directed.'],
            ['Fever / Pain', 'Mefenamic Acid 500 mg tablet/capsule', 'Analgesics', 'Use for pain relief as directed.'],
            ['Allergy / Itchiness / Rashes', 'Cetirizine 10 mg tablet', 'Antihistamines', 'Use for allergy symptoms, itchiness, or rashes as directed.'],
            ['Allergy / Itchiness / Rashes', 'Cetirizine 5 mg/5 mL syrup', 'Antihistamines', 'Use for allergy symptoms, itchiness, or rashes as directed.'],
            ['Allergy / Itchiness / Rashes', 'Loratadine 10 mg tablet', 'Antihistamines', 'Use for allergy symptoms as directed.'],
            ['Allergy / Itchiness / Rashes', 'Loratadine 5 mg/5 mL syrup', 'Antihistamines', 'Use for allergy symptoms as directed.'],
            ['Allergy / Itchiness / Rashes', 'Diphenhydramine 25 mg capsule/tablet', 'Antihistamines', 'May cause drowsiness. Use for allergy symptoms as directed.'],
            ['Allergy / Itchiness / Rashes', 'Diphenhydramine 12.5 mg/5 mL syrup', 'Antihistamines', 'May cause drowsiness. Use for allergy symptoms as directed.'],
            ['Stomach / Digestion', 'Antacid chewable tablet', 'Gastrointestinal Drugs', 'Use for acidity or stomach discomfort as directed.'],
            ['Stomach / Digestion', 'Antacid oral suspension', 'Gastrointestinal Drugs', 'Use for acidity or stomach discomfort as directed.'],
            ['Stomach / Digestion', 'Oral Rehydration Salts / ORS sachet', 'Gastrointestinal Drugs', 'Use for dehydration support as directed.'],
            ['Stomach / Digestion', 'Simethicone oral drops', 'Gastrointestinal Drugs', 'Use for gas discomfort as directed.'],
            ['Stomach / Digestion', 'Simethicone chewable tablet', 'Gastrointestinal Drugs', 'Use for gas discomfort as directed.'],
            ['Stomach / Digestion', 'Loperamide 2 mg capsule', 'Gastrointestinal Drugs', 'For older students/staff only, with caution.'],
            ['Stomach / Digestion', 'Bisacodyl 5 mg tablet', 'Laxatives', "For staff use or with doctor's order only."],
            ['Cough / Colds / Throat', 'Saline nasal spray', 'Decongestants', 'Use for nasal dryness or congestion as directed.'],
            ['Cough / Colds / Throat', 'Saline nasal drops', 'Decongestants', 'Use for nasal dryness or congestion as directed.'],
            ['Cough / Colds / Throat', 'Throat lozenges', 'Respiratory Drugs', 'Use for throat discomfort as directed.'],
            ['Cough / Colds / Throat', 'Guaifenesin syrup', 'Respiratory Drugs', 'Use for cough with phlegm as directed.'],
            ['Cough / Colds / Throat', 'Dextromethorphan syrup', 'Respiratory Drugs', 'Only with clinic protocol.'],
            ['Cough / Colds / Throat', 'Mentholated rub', 'Respiratory Drugs', 'Use externally as directed.'],
            ['Wounds / Skin Antiseptics', 'Povidone-Iodine 10% solution', 'Dermatologic Drugs', 'Use for wound antisepsis as directed.'],
            ['Wounds / Skin Antiseptics', 'Chlorhexidine solution', 'Dermatologic Drugs', 'Use for skin or wound antisepsis as directed.'],
            ['Wounds / Skin Antiseptics', '70% Isopropyl Alcohol', 'Dermatologic Drugs', 'Use for skin antisepsis as directed.'],
            ['Wounds / Skin Antiseptics', 'Hydrogen Peroxide 3% solution', 'Dermatologic Drugs', 'Limited use only.'],
            ['Wounds / Skin Antiseptics', 'Antiseptic wound spray', 'Dermatologic Drugs', 'Use for minor wound care as directed.'],
            ['Skin Irritation / Insect Bites / Mild Rashes', 'Calamine lotion', 'Dermatologic Drugs', 'Use for itchiness or mild skin irritation as directed.'],
            ['Skin Irritation / Insect Bites / Mild Rashes', 'Hydrocortisone 1% cream', 'Dermatologic Drugs', 'Use for mild rashes or inflammation as directed.'],
            ['Skin Irritation / Insect Bites / Mild Rashes', 'Zinc oxide ointment', 'Dermatologic Drugs', 'Use for skin protection or irritation as directed.'],
            ['Skin Irritation / Insect Bites / Mild Rashes', 'Aloe vera gel', 'Dermatologic Drugs', 'Use for mild skin irritation as directed.'],
            ['Skin Irritation / Insect Bites / Mild Rashes', 'Petroleum jelly', 'Dermatologic Drugs', 'Use for skin protection or dryness as directed.'],
            ['Skin Irritation / Insect Bites / Mild Rashes', 'Antifungal cream, Clotrimazole 1%', 'Antifungals', 'Use for fungal skin infections as directed.'],
            ['Skin Irritation / Insect Bites / Mild Rashes', 'Antifungal cream, Miconazole 2%', 'Antifungals', 'Use for fungal skin infections as directed.'],
            ['Burns', 'Burn gel', 'Dermatologic Drugs', 'Use for minor burns as directed.'],
            ['Burns', 'Aloe vera burn gel', 'Dermatologic Drugs', 'Use for minor burns as directed.'],
            ['Burns', 'Silver Sulfadiazine 1% cream', 'Dermatologic Drugs', "Only with doctor's order/protocol."],
            ['Eye Care', 'Sterile eye wash solution', 'Ophthalmic Drugs', 'Use for eye irrigation as directed.'],
            ['Eye Care', 'Sterile normal saline solution', 'Ophthalmic Drugs', 'Use for sterile rinsing or irrigation as directed.'],
            ['Eye Care', 'Artificial tears / lubricant eye drops', 'Ophthalmic Drugs', 'Use for dry or irritated eyes as directed.'],
            ['Oral / Dental', 'Oral antiseptic gargle', 'Other', 'Use for oral hygiene support as directed.'],
            ['Oral / Dental', 'Mouth ulcer gel', 'Other', 'Use for mouth ulcers as directed.'],
            ['Oral / Dental', 'Temporary toothache gel', 'Other', 'With caution, not for routine use.'],
            ['Emergency / Special-Use Medicines', 'Oral glucose tablets', 'Nutritional Supplements', 'Use for low blood sugar support as directed.'],
            ['Emergency / Special-Use Medicines', 'Oral glucose gel', 'Nutritional Supplements', 'Use for low blood sugar support as directed.'],
            ['Emergency / Special-Use Medicines', 'Salbutamol inhaler', 'Bronchodilators', 'Student-specific or clinic protocol.'],
            ['Emergency / Special-Use Medicines', 'Salbutamol nebule solution', 'Bronchodilators', "With doctor's order."],
            ['Emergency / Special-Use Medicines', 'Epinephrine auto-injector', 'Other', 'Only if prescribed.'],
            ['Emergency / Special-Use Medicines', 'Activated charcoal', 'Other', 'Only if directed by poison control/doctor.'],
            ['Emergency / Special-Use Medicines', 'Aspirin 80 mg or 325 mg', 'Analgesics', "For adult emergency protocol only; not for children unless ordered by doctor."],
            ['Student-Specific Medicines', 'Prescribed asthma inhaler', 'Bronchodilators', 'Use only as prescribed for the specific student.'],
            ['Student-Specific Medicines', 'Prescribed seizure emergency medicine', 'Other', 'Use only as prescribed for the specific student.'],
            ['Student-Specific Medicines', 'Prescribed allergy medicine', 'Antihistamines', 'Use only as prescribed for the specific student.'],
            ['Student-Specific Medicines', 'Prescribed diabetes medicine', 'Other', 'Use only as prescribed for the specific student.'],
            ['Student-Specific Medicines', 'Prescribed maintenance medicine', 'Other', 'Use only as prescribed for the specific student.'],
            ['Student-Specific Medicines', 'Prescribed EpiPen/epinephrine auto-injector', 'Other', 'Use only as prescribed for the specific student.'],
        ];

        foreach ($medicines as [$group, $name, $category, $usage]) {
            DB::table('medicines')->updateOrInsert(
                ['name' => $name],
                [
                    'category' => $category,
                    'description' => $group,
                    'usage' => $usage,
                    'quantity' => 50,
                    'is_available' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        $this->seedDemoClinicData();
    }

    private function seedDemoClinicData(): void
    {
        $demoUsers = [
            ['Alyssa Mae Santos', 'alyssa.santos', 'alyssa.santos@clinicdemo.test', 'STU-2026-001', 'BS Nursing', 'Female', 'Student'],
            ['Miguel Reyes', 'miguel.reyes', 'miguel.reyes@clinicdemo.test', 'STU-2026-002', 'BS Information Technology', 'Male', 'Student'],
            ['Bianca Cruz', 'bianca.cruz', 'bianca.cruz@clinicdemo.test', 'STU-2026-003', 'BS Education', 'Female', 'Student'],
            ['John Carlo Lim', 'john.lim', 'john.lim@clinicdemo.test', 'STU-2026-004', 'BS Criminology', 'Male', 'Student'],
            ['Patricia Gomez', 'patricia.gomez', 'patricia.gomez@clinicdemo.test', 'STU-2026-005', 'BS Business Administration', 'Female', 'Student'],
            ['Nathaniel Flores', 'nathan.flores', 'nathan.flores@clinicdemo.test', 'STU-2026-006', 'BS Agriculture', 'Male', 'Student'],
            ['Rica Mendoza', 'rica.mendoza', 'rica.mendoza@clinicdemo.test', 'STU-2026-007', 'BS Hospitality Management', 'Female', 'Student'],
            ['Daniel Aquino', 'daniel.aquino', 'daniel.aquino@clinicdemo.test', 'STU-2026-008', 'BS Information Technology', 'Male', 'Student'],
            ['Sophia Villanueva', 'sophia.villanueva', 'sophia.villanueva@clinicdemo.test', 'STU-2026-009', 'BS Nursing', 'Female', 'Student'],
            ['Mark Adrian Dela Cruz', 'mark.delacruz', 'mark.delacruz@clinicdemo.test', 'STU-2026-010', 'BS Education', 'Male', 'Student'],
            ['Christine Navarro', 'christine.navarro', 'christine.navarro@clinicdemo.test', 'STU-2026-011', 'BS Business Administration', 'Female', 'Student'],
            ['Joshua Tan', 'joshua.tan', 'joshua.tan@clinicdemo.test', 'STU-2026-012', 'BS Criminology', 'Male', 'Student'],
            ['Erika Castillo', 'erika.castillo', 'erika.castillo@clinicdemo.test', 'STU-2026-013', 'BS Agriculture', 'Female', 'Student'],
            ['Francis Uy', 'francis.uy', 'francis.uy@clinicdemo.test', 'STU-2026-014', 'BS Hospitality Management', 'Male', 'Student'],
            ['Janelle Ramos', 'janelle.ramos', 'janelle.ramos@clinicdemo.test', 'STU-2026-015', 'BS Information Technology', 'Female', 'Student'],
            ['Kevin Bautista', 'kevin.bautista', 'kevin.bautista@clinicdemo.test', 'STU-2026-016', 'BS Nursing', 'Male', 'Student'],
            ['Lara Gutierrez', 'lara.gutierrez', 'lara.gutierrez@clinicdemo.test', 'STU-2026-017', 'BS Education', 'Female', 'Student'],
            ['Rafael Mercado', 'rafael.mercado', 'rafael.mercado@clinicdemo.test', 'STU-2026-018', 'BS Business Administration', 'Male', 'Student'],
        ];

        foreach ($demoUsers as [$name, $username, $email, $studentId, $department, $gender, $type]) {
            DB::table('users')->updateOrInsert(
                ['email' => $email],
                [
                    'name' => $name,
                    'username' => $username,
                    'password' => Hash::make('password123'),
                    'role' => 'User',
                    'status' => 'approved',
                    'student_id' => $studentId,
                    'employee_id' => null,
                    'user_type' => $type,
                    'department' => $department,
                    'contact_number' => '09' . fake()->numerify('#########'),
                    'date_of_birth' => Carbon::now()->subYears(rand(18, 23))->subDays(rand(1, 365))->toDateString(),
                    'gender' => $gender,
                    'address' => 'Davao del Sur, Philippines',
                    'created_at' => Carbon::now()->subMonths(rand(1, 8)),
                    'updated_at' => now(),
                ]
            );
        }

        $superAdminId = DB::table('users')->where('email', 'superadmin@clinicqr.com')->value('id');
        $adminId = DB::table('users')->where('email', 'admin@clinicqr.com')->value('id');
        $demoUserIds = DB::table('users')->where('email', 'like', '%@clinicdemo.test')->pluck('id');

        DB::table('appointments')->whereIn('user_id', $demoUserIds)->delete();
        DB::table('notifications')->whereIn('user_id', $demoUserIds)->delete();
        DB::table('activity_logs')->whereIn('user_id', $demoUserIds)->delete();
        DB::table('clearance_records')->whereIn('user_id', $demoUserIds)->delete();
        DB::table('visit_logs')->whereIn('user_id', $demoUserIds)->delete();

        $visitPurposes = [
            ['Fever', 'Temperature checked; advised rest, hydration, and monitoring.'],
            ['Cough / Colds', 'Reported cough and nasal congestion; given supportive care instructions.'],
            ['Headache', 'Assessed for migraine or fatigue triggers; observed in clinic.'],
            ['Stomach Pain', 'Assessed abdominal discomfort; advised light meals and hydration.'],
            ['Take Medicine', 'Requested approved medicine from clinic inventory.'],
            ['Injury Treatment', 'Minor wound cleaned and dressed; advised return if swelling occurs.'],
            ['Allergy / Rashes', 'Mild itching/rashes assessed; advised trigger avoidance.'],
            ['Menstrual Cramps', 'Rested in clinic; pain level monitored.'],
            ['Dizziness', 'Vital signs checked; advised food intake and hydration.'],
            ['Follow-up Checkup', 'Follow-up assessment after previous clinic visit.'],
        ];

        $visits = [];
        for ($i = 0; $i < 140; $i++) {
            $userId = $demoUserIds[$i % $demoUserIds->count()];
            [$purpose, $note] = $visitPurposes[$i % count($visitPurposes)];
            $visitedAt = Carbon::now()
                ->subDays($i % 150)
                ->setTime(8 + ($i % 8), [0, 15, 30, 45][$i % 4]);

            $visits[] = [
                'user_id' => $userId,
                'visit_purpose' => $purpose,
                'timestamp' => $visitedAt,
                'qr_scanned' => $i % 5 !== 0,
                'verification_status' => $i % 11 === 0 ? 'Pending' : ($i % 7 === 0 ? 'Cleared' : 'Verified'),
                'medical_notes' => '[DEMO] ' . $note,
                'cleared_by' => $i % 7 === 0 ? $adminId : null,
                'scan_latitude' => 6.7489000 + (($i % 9) * 0.0001),
                'scan_longitude' => 125.3572000 + (($i % 7) * 0.0001),
                'scan_accuracy' => 6 + ($i % 18),
                'scan_location_status' => $i % 6 === 0 ? 'Manual log' : 'Inside clinic radius',
                'created_at' => $visitedAt,
                'updated_at' => $visitedAt,
            ];
        }
        DB::table('visit_logs')->insert($visits);

        $recentVisitIds = DB::table('visit_logs')
            ->whereIn('user_id', $demoUserIds)
            ->orderBy('timestamp', 'desc')
            ->limit(18)
            ->pluck('log_id');

        foreach ($recentVisitIds as $index => $logId) {
            $visit = DB::table('visit_logs')->where('log_id', $logId)->first();
            DB::table('clearance_records')->insert([
                'log_id' => $logId,
                'user_id' => $visit->user_id,
                'visit_purpose' => $visit->visit_purpose,
                'clearance_type' => $index % 3 === 0 ? 'Return-to-class clearance' : 'Clinic visit clearance',
                'contact_number' => DB::table('users')->where('id', $visit->user_id)->value('contact_number'),
                'school_year' => '2025-2026',
                'semester' => 'Second Semester',
                'purpose' => 'Clinic documentation',
                'documents' => json_encode(['clinic-assessment-form.pdf']),
                'status' => $index % 5 === 0 ? 'Pending' : ($index % 7 === 0 ? 'Rejected' : 'Approved'),
                'signed_by' => $index % 5 === 0 ? null : $adminId,
                'signed_at' => $index % 5 === 0 ? null : Carbon::parse($visit->timestamp)->addMinutes(40),
                'approved_at' => $index % 5 === 0 ? null : Carbon::parse($visit->timestamp)->addMinutes(40),
                'approved_by' => $index % 5 === 0 ? null : $adminId,
                'notes' => '[DEMO] Clearance prepared from clinic visit record.',
                'created_at' => $visit->created_at,
                'updated_at' => now(),
            ]);
        }

        foreach ($demoUserIds->take(12)->values() as $index => $userId) {
            $date = Carbon::now()->addDays($index % 9);
            DB::table('appointments')->insert([
                'user_id' => $userId,
                'appointment_type' => ['Consultation', 'Follow-up Checkup', 'Medical Certificate Request', 'Medicine Consultation'][$index % 4],
                'appointment_date' => $date->toDateString(),
                'appointment_time' => sprintf('%02d:%02d:00', 9 + ($index % 6), ($index % 2) * 30),
                'status' => ['pending', 'approved', 'completed', 'cancelled'][$index % 4],
                'notes' => '[DEMO] Appointment created for clinic workflow testing.',
                'admin_comment' => $index % 4 === 1 ? 'Approved for scheduled clinic consultation.' : null,
                'approved_by' => $index % 4 === 1 ? $adminId : null,
                'created_at' => Carbon::now()->subDays($index + 1),
                'updated_at' => now(),
            ]);
        }

        foreach ($demoUserIds->take(10)->values() as $index => $userId) {
            DB::table('notifications')->insert([
                'user_id' => $userId,
                'title' => ['Clinic Visit Recorded', 'Appointment Update', 'Medicine Reminder'][$index % 3],
                'message' => '[DEMO] This sample notification helps test the student notification center.',
                'type' => ['info', 'success', 'warning'][$index % 3],
                'link' => $index % 2 === 0 ? '/user/visits' : '/student/appointments',
                'is_read' => $index % 3 === 0,
                'created_at' => Carbon::now()->subDays($index),
                'updated_at' => now(),
            ]);
        }

        foreach (range(0, 24) as $index) {
            DB::table('activity_logs')->insert([
                'user_id' => $index % 4 === 0 ? $superAdminId : $adminId,
                'action' => ['Verified clinic check-in', 'Updated medicine stock', 'Approved clearance', 'Reviewed monthly trend'][$index % 4],
                'timestamp' => Carbon::now()->subHours($index * 3),
                'ip_address' => '127.0.0.1',
                'additional_details' => '[DEMO] System activity generated for dashboard testing.',
                'created_at' => Carbon::now()->subHours($index * 3),
                'updated_at' => now(),
            ]);
        }

        $inventoryLevels = [
            'Paracetamol 500 mg tablet' => 84,
            'Paracetamol 250 mg/5 mL suspension' => 26,
            'Ibuprofen 200 mg tablet' => 18,
            'Cetirizine 10 mg tablet' => 42,
            'Loratadine 10 mg tablet' => 9,
            'Oral Rehydration Salts / ORS sachet' => 65,
            'Antacid chewable tablet' => 31,
            'Guaifenesin syrup' => 15,
            'Povidone-Iodine 10% solution' => 22,
            '70% Isopropyl Alcohol' => 12,
            'Calamine lotion' => 7,
            'Hydrocortisone 1% cream' => 0,
            'Sterile eye wash solution' => 11,
            'Salbutamol inhaler' => 4,
            'Oral glucose tablets' => 33,
            'Epinephrine auto-injector' => 2,
        ];

        foreach ($inventoryLevels as $name => $quantity) {
            DB::table('medicines')->where('name', $name)->update([
                'quantity' => $quantity,
                'is_available' => $quantity > 0,
                'updated_at' => now(),
            ]);
        }
    }
}
