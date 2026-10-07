package com.app.ecom;

import com.app.ecom.dto.*;
import com.app.ecom.exception.BadRequestException;
import com.app.ecom.exception.ResourceNotFoundException;
import com.app.ecom.model.*;
import com.app.ecom.repository.ProductRepository;
import com.app.ecom.repository.UserRepository;
import com.app.ecom.repository.WishlistItemRepository;
import com.app.ecom.security.IdentityResolver;
import com.app.ecom.service.UserService;
import com.app.ecom.service.WishlistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class Phase5CustomerAccountWishlistTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private WishlistItemRepository wishlistItemRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @InjectMocks
    private WishlistService wishlistService;

    private User testUser;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setEmail("john@example.com");
        testUser.setPassword("encodedOldPassword");
        testUser.setRole(UserRole.CUSTOMER);

        testProduct = new Product();
        testProduct.setId(100L);
        testProduct.setName("Wireless Headphones");
        testProduct.setPrice(new BigDecimal("99.99"));
        testProduct.setActive(true);
    }

    @Test
    void A_authenticatedUserCanGetOwnProfile() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        Optional<UserResponse> res = userService.fetchUser(1L);
        assertTrue(res.isPresent());
        assertEquals("John", res.get().getFirstName());
        assertEquals("john@example.com", res.get().getEmail());
    }

    @Test
    void B_authenticatedUserCanUpdateProfile() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProfileUpdateRequest req = new ProfileUpdateRequest();
        req.setFirstName("Johnny");
        req.setLastName("Updated");
        req.setPhone("1234567890");

        UserResponse res = userService.updateProfile(1L, req);
        assertEquals("Johnny", res.getFirstName());
        assertEquals("Updated", res.getLastName());
        assertEquals("1234567890", res.getPhone());
    }

    @Test
    void C_roleCannotBeChangedThroughProfileUpdate() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProfileUpdateRequest req = new ProfileUpdateRequest();
        req.setFirstName("Johnny");

        UserResponse res = userService.updateProfile(1L, req);
        assertEquals(UserRole.CUSTOMER, res.getRole());
    }

    @Test
    void D_currentPasswordRequiredForPasswordChange() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("");
        req.setNewPassword("newPassword123");

        assertThrows(BadRequestException.class, () -> userService.changePassword(1L, req));
    }

    @Test
    void E_wrongCurrentPasswordRejected() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPass", "encodedOldPassword")).thenReturn(false);

        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("wrongPass");
        req.setNewPassword("newPassword123");

        assertThrows(BadRequestException.class, () -> userService.changePassword(1L, req));
    }

    @Test
    void F_correctPasswordChangeSucceeds() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("oldPassword", "encodedOldPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPassword123")).thenReturn("encodedNewPassword");

        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("oldPassword");
        req.setNewPassword("newPassword123");

        assertDoesNotThrow(() -> userService.changePassword(1L, req));
        verify(userRepository).save(argThat(user -> "encodedNewPassword".equals(user.getPassword())));
    }

    @Test
    void G_addProductToWishlistSucceeds() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(wishlistItemRepository.findByUserAndProduct(testUser, testProduct)).thenReturn(Optional.empty());

        WishlistItem item = WishlistItem.builder().id(10L).user(testUser).product(testProduct).build();
        when(wishlistItemRepository.save(any(WishlistItem.class))).thenReturn(item);

        WishlistItemResponse res = wishlistService.addToWishlist(1L, 100L);
        assertNotNull(res);
        assertEquals(100L, res.getProductId());
        assertEquals("Wireless Headphones", res.getProductName());
    }

    @Test
    void H_duplicateWishlistAddDoesNotCreateDuplicateRow() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));

        WishlistItem existingItem = WishlistItem.builder().id(10L).user(testUser).product(testProduct).build();
        when(wishlistItemRepository.findByUserAndProduct(testUser, testProduct)).thenReturn(Optional.of(existingItem));

        WishlistItemResponse res = wishlistService.addToWishlist(1L, 100L);
        assertEquals(10L, res.getId());
        verify(wishlistItemRepository, never()).save(any());
    }

    @Test
    void I_removeWishlistItemSucceeds() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));

        assertDoesNotThrow(() -> wishlistService.removeFromWishlist(1L, 100L));
        verify(wishlistItemRepository).deleteByUserAndProduct(testUser, testProduct);
    }

    @Test
    void J_userOnlySeesOwnWishlist() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        WishlistItem item = WishlistItem.builder().id(10L).user(testUser).product(testProduct).build();
        when(wishlistItemRepository.findByUserOrderByCreatedAtDesc(testUser)).thenReturn(List.of(item));

        List<WishlistItemResponse> list = wishlistService.getWishlistForUser(1L);
        assertEquals(1, list.size());
        assertEquals(100L, list.get(0).getProductId());
    }

    @Test
    void K_inactiveProductCannotBeNewlyWishlisted() {
        testProduct.setActive(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));

        assertThrows(BadRequestException.class, () -> wishlistService.addToWishlist(1L, 100L));
    }
}
