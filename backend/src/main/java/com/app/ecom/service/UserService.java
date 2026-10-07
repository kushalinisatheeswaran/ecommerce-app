package com.app.ecom.service;

import com.app.ecom.dto.AddressDTO;
import com.app.ecom.dto.UserRequest;
import com.app.ecom.dto.UserResponse;
import com.app.ecom.exception.BadRequestException;
import com.app.ecom.exception.ConflictException;
import com.app.ecom.model.Address;
import com.app.ecom.model.User;
import com.app.ecom.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public List<UserResponse> fetchAllUsers() {
      return userRepository.findAll().stream()
              .map(this::mapToUserResponse)
              .collect(Collectors.toList());
    }

    public UserResponse addUser(UserRequest userRequest) {
        if (userRequest.getEmail() == null || userRequest.getEmail().trim().isEmpty()) {
            throw new BadRequestException("Email is required.");
        }
        String normalizedEmail = userRequest.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ConflictException("User with this email already exists.");
        }
        User user = new User();
        updateUserFromRequest(user, userRequest);
        user.setEmail(normalizedEmail);
        try {
            User savedUser = userRepository.save(user);
            return mapToUserResponse(savedUser);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new ConflictException("User with this email already exists.");
        }
    }

    private void updateUserFromRequest(User user, UserRequest userRequest) {
        user.setFirstName(userRequest.getFirstName());
        user.setLastName(userRequest.getLastName());
        if (userRequest.getEmail() != null) {
            user.setEmail(userRequest.getEmail().trim().toLowerCase());
        }
        user.setPhone(userRequest.getPhone());
        if (userRequest.getPassword() != null && !userRequest.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        }

        if(userRequest.getAddress() !=null){
            Address address = user.getAddress() != null ? user.getAddress() : new Address();
            address.setStreet(userRequest.getAddress().getStreet());
            address.setState(userRequest.getAddress().getState());
            address.setZipcode(userRequest.getAddress().getZipcode());
            address.setCity(userRequest.getAddress().getCity());
            address.setCountry(userRequest.getAddress().getCountry());
            user.setAddress(address);
        }
    }

    public Optional<UserResponse> fetchUser(Long id) {
        return userRepository.findById(id)
                .map(this::mapToUserResponse);
    }

    public UserResponse updateProfile(Long userId, com.app.ecom.dto.ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.app.ecom.exception.ResourceNotFoundException("User not found"));

        if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
            user.setFirstName(request.getFirstName().trim());
        }
        if (request.getLastName() != null && !request.getLastName().isBlank()) {
            user.setLastName(request.getLastName().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }

        if (request.getAddress() != null) {
            Address address = user.getAddress() != null ? user.getAddress() : new Address();
            address.setStreet(request.getAddress().getStreet());
            address.setCity(request.getAddress().getCity());
            address.setState(request.getAddress().getState());
            address.setZipcode(request.getAddress().getZipcode());
            address.setCountry(request.getAddress().getCountry());
            user.setAddress(address);
        }

        User saved = userRepository.save(user);
        return mapToUserResponse(saved);
    }

    public void changePassword(Long userId, com.app.ecom.dto.ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.app.ecom.exception.ResourceNotFoundException("User not found"));

        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
            throw new BadRequestException("Current password is required");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Incorrect current password");
        }
        if (request.getNewPassword() == null || request.getNewPassword().trim().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters long");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        userRepository.save(user);
    }

    public boolean updateUser(Long id ,UserRequest updatedUserRequest){
        return userRepository.findById(id).map(existingUser ->{
                updateUserFromRequest(existingUser,updatedUserRequest);
                userRepository.save(existingUser);
                return true;
                }).orElse(false);
    }

    private UserResponse mapToUserResponse(User user){
        UserResponse response =new UserResponse();
        response.setId(String.valueOf(user.getId()));
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setRole(user.getRole());

        if(user.getAddress() !=null){
            AddressDTO addressDTO= new AddressDTO();
            addressDTO.setStreet(user.getAddress().getStreet());
            addressDTO.setCity(user.getAddress().getCity());
            addressDTO.setState(user.getAddress().getState());
            addressDTO.setCountry(user.getAddress().getCountry());
            addressDTO.setZipcode(user.getAddress().getZipcode());
            response.setAddress(addressDTO);
        }
        return response;
    }
}