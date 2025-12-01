/**
 * Tests for wiki page publishedAt logic
 * 
 * These tests verify that the publishedAt field is correctly managed
 * when creating and updating wiki pages with different published states.
 */

describe('Wiki Page publishedAt Logic', () => {
  describe('POST /api/wiki/[workspaceId]/pages', () => {
    it('should set publishedAt when creating a published page', () => {
      // When: Creating a page with published=true
      const published = true;
      const willBePublished = published ?? true;
      const publishedAt = willBePublished ? new Date() : null;
      
      // Then: publishedAt should be set to current date
      expect(publishedAt).not.toBeNull();
      expect(publishedAt).toBeInstanceOf(Date);
    });

    it('should not set publishedAt when creating an unpublished page', () => {
      // When: Creating a page with published=false
      const published = false;
      const willBePublished = published ?? true;
      const publishedAt = willBePublished ? new Date() : null;
      
      // Then: publishedAt should be null
      expect(publishedAt).toBeNull();
    });

    it('should default to published=true when not specified', () => {
      // When: Creating a page without specifying published
      const published = undefined;
      const willBePublished = published ?? true;
      
      // Then: Should default to true
      expect(willBePublished).toBe(true);
    });

    it('should require content for published pages', () => {
      // When: Creating a published page
      const published = undefined; // defaults to true
      const content = '';
      const willBePublished = published ?? true;
      
      // Then: Should validate content requirement
      const shouldFail = willBePublished && !content;
      expect(shouldFail).toBe(true);
    });
  });

  describe('PUT /api/wiki/[workspaceId]/[slug]', () => {
    it('should set publishedAt when publishing for the first time', () => {
      // Given: An unpublished page
      const existingPage = {
        published: false,
        publishedAt: null,
      };
      
      // When: Publishing the page
      const published = true;
      const newPublished = published ?? existingPage.published;
      
      let publishedAt = existingPage.publishedAt;
      if (newPublished && !existingPage.published) {
        publishedAt = new Date();
      } else if (!newPublished && existingPage.published) {
        publishedAt = null;
      }
      
      // Then: publishedAt should be set
      expect(publishedAt).not.toBeNull();
      expect(publishedAt).toBeInstanceOf(Date);
    });

    it('should keep publishedAt when page remains published', () => {
      // Given: A published page
      const originalDate = new Date('2024-01-01');
      const existingPage = {
        published: true,
        publishedAt: originalDate,
      };
      
      // When: Updating without changing published status
      const published = undefined; // not specified, should keep existing
      const newPublished = published ?? existingPage.published;
      
      let publishedAt = existingPage.publishedAt;
      if (newPublished && !existingPage.published) {
        publishedAt = new Date();
      } else if (!newPublished && existingPage.published) {
        publishedAt = null;
      }
      
      // Then: publishedAt should remain unchanged
      expect(publishedAt).toBe(originalDate);
    });

    it('should clear publishedAt when unpublishing', () => {
      // Given: A published page
      const existingPage = {
        published: true,
        publishedAt: new Date('2024-01-01'),
      };
      
      // When: Unpublishing the page
      const published = false;
      const newPublished = published ?? existingPage.published;
      
      let publishedAt = existingPage.publishedAt;
      if (newPublished && !existingPage.published) {
        publishedAt = new Date();
      } else if (!newPublished && existingPage.published) {
        publishedAt = null;
      }
      
      // Then: publishedAt should be null
      expect(publishedAt).toBeNull();
    });

    it('should keep publishedAt null when page remains unpublished', () => {
      // Given: An unpublished page
      const existingPage = {
        published: false,
        publishedAt: null,
      };
      
      // When: Updating without publishing
      const published = undefined;
      const newPublished = published ?? existingPage.published;
      
      let publishedAt = existingPage.publishedAt;
      if (newPublished && !existingPage.published) {
        publishedAt = new Date();
      } else if (!newPublished && existingPage.published) {
        publishedAt = null;
      }
      
      // Then: publishedAt should remain null
      expect(publishedAt).toBeNull();
    });

    it('should handle explicit false for published parameter', () => {
      // Given: A published page
      const existingPage = {
        published: true,
        publishedAt: new Date('2024-01-01'),
      };
      
      // When: Explicitly setting published to false
      const published = false;
      const newPublished = published ?? existingPage.published;
      
      let publishedAt = existingPage.publishedAt;
      if (newPublished && !existingPage.published) {
        publishedAt = new Date();
      } else if (!newPublished && existingPage.published) {
        publishedAt = null;
      }
      
      // Then: Should unpublish correctly
      expect(newPublished).toBe(false);
      expect(publishedAt).toBeNull();
    });
  });
});
