package com.tripplanner.favorite;

import com.tripplanner.favorite.dto.FavoriteRequest;
import com.tripplanner.favorite.dto.FavoriteResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Favorites are strictly user-scoped: user A can never remove user B's favorite. */
@ExtendWith(MockitoExtension.class)
class FavoriteServiceTest {

    private static final Long USER_A = 1L;
    private static final Long USER_B = 2L;
    private static final Long FAVORITE_ID = 10L;

    @Mock
    private FavoriteRepository favoriteRepository;

    @InjectMocks
    private FavoriteService favoriteService;

    @Test
    void removeFavorite_otherUsersFavorite_throwsAccessDenied_andNeverDeletes() {
        when(favoriteRepository.findById(FAVORITE_ID)).thenReturn(Optional.of(favoriteOf(USER_A)));

        assertThrows(AccessDeniedException.class,
                () -> favoriteService.removeFavorite(USER_B, FAVORITE_ID));

        verify(favoriteRepository, never()).delete(any());
    }

    @Test
    void removeFavorite_missingFavorite_throwsNotFound() {
        when(favoriteRepository.findById(FAVORITE_ID)).thenReturn(Optional.empty());

        assertThrows(com.tripplanner.exception.FavoriteNotFoundException.class,
                () -> favoriteService.removeFavorite(USER_A, FAVORITE_ID));
    }

    @Test
    void ownerCanRemoveOwnFavorite() {
        Favorite favorite = favoriteOf(USER_A);
        when(favoriteRepository.findById(FAVORITE_ID)).thenReturn(Optional.of(favorite));

        favoriteService.removeFavorite(USER_A, FAVORITE_ID);

        verify(favoriteRepository).delete(favorite);
    }

    @Test
    void addFavorite_isIdempotentForSamePlace() {
        Favorite existing = favoriteOf(USER_A);
        when(favoriteRepository.findByUserIdAndPlaceId(USER_A, "osm:way:1"))
                .thenReturn(Optional.of(existing));

        FavoriteResponse response = favoriteService.addFavorite(USER_A,
                new FavoriteRequest("osm:way:1", "Tour Eiffel"));

        assertEquals(existing.getId(), response.id());
        verify(favoriteRepository, never()).save(any());
    }

    @Test
    void listFavorites_queriesOnlyThatUser() {
        when(favoriteRepository.findByUserIdOrderByCreatedAtDesc(USER_A)).thenReturn(List.of());

        favoriteService.listFavorites(USER_A);

        verify(favoriteRepository).findByUserIdOrderByCreatedAtDesc(USER_A);
        verify(favoriteRepository, never()).findAll();
    }

    private Favorite favoriteOf(Long userId) {
        Favorite favorite = new Favorite(userId, "osm:way:1", "Tour Eiffel");
        setId(favorite, FAVORITE_ID);
        return favorite;
    }

    private void setId(Favorite favorite, Long id) {
        try {
            Field field = Favorite.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(favorite, id);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }
}
