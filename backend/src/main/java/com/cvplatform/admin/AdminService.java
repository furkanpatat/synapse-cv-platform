package com.cvplatform.admin;

import com.cvplatform.admin.dto.AdminCompanyDto;
import com.cvplatform.admin.dto.AdminStats;
import com.cvplatform.admin.dto.AdminUserDto;
import com.cvplatform.common.ApiException;
import com.cvplatform.company.Company;
import com.cvplatform.company.CompanyRepository;
import com.cvplatform.jobs.ApplicationRepository;
import com.cvplatform.jobs.JobPostingRepository;
import com.cvplatform.jobs.JobStatus;
import com.cvplatform.user.Role;
import com.cvplatform.user.User;
import com.cvplatform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final JobPostingRepository jobRepository;
    private final ApplicationRepository applicationRepository;

    public AdminStats stats() {
        List<User> allUsers = userRepository.findAll();
        List<Company> allCompanies = companyRepository.findAll();

        long banned = allUsers.stream().filter(User::isBanned).count();
        long verifiedCompanies = allCompanies.stream().filter(Company::isVerified).count();

        return new AdminStats(
                allUsers.size(),
                allCompanies.size(),
                verifiedCompanies,
                allCompanies.size() - verifiedCompanies,
                banned,
                jobRepository.count(),
                jobRepository.findAllByStatus(JobStatus.ACTIVE,
                        org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements(),
                applicationRepository.count()
        );
    }

    public List<AdminUserDto> listUsers() {
        return userRepository.findAll().stream()
                .map(AdminUserDto::from)
                .toList();
    }

    public List<AdminCompanyDto> listCompanies() {
        return companyRepository.findAll().stream()
                .map(AdminCompanyDto::from)
                .toList();
    }

    @Transactional
    public AdminUserDto setBanned(UUID userId, boolean banned) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "User not found"));
        if (user.getRole() == Role.ADMIN) {
            throw ApiException.forbidden("CANNOT_BAN_ADMIN", "Admin accounts cannot be banned");
        }
        user.setBanned(banned);
        return AdminUserDto.from(userRepository.save(user));
    }

    @Transactional
    public AdminCompanyDto setVerified(UUID companyId, boolean verified) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> ApiException.notFound("COMPANY_NOT_FOUND", "Company not found"));
        company.setVerified(verified);
        return AdminCompanyDto.from(companyRepository.save(company));
    }
}
