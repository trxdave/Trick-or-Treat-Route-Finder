

# Create your models here.
class House (models.Model):
    STATUS_CHOICES = [
        ('giving', 'Giving Out Candy'),
        ('out', 'Out of Candy'),
        ('none', 'Not Participating'),
    ]
    address = models.CharField(max_length=255)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='none')
    latitude = models.FloatField()
    longitude = models.FloatField()

    def __str__(self):
        return f"{self.address} - {self.get_status_display()}"
